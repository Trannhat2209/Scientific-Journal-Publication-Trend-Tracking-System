using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Export;
using ScientificJournal.DataAccess.Context;

namespace ScientificJournal.Business.Services.Implementations;

public class ExportService : IExportService
{
    private readonly AppDbContext _context;

    public ExportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportTrendReportAsync(ExportRequestDto request)
    {
        var data = await _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null &&
                        (m.Keyword.Term.Contains(request.Keyword) || m.Keyword.NormalizedTerm.Contains(request.Keyword)) &&
                        m.Year >= request.FromYear &&
                        m.Year <= request.ToYear)
            .OrderBy(m => m.Year)
            .ToListAsync();

        var rows = new List<IReadOnlyList<object?>>
        {
            new object?[] { "Keyword", "Year", "Publication Count", "Trending Score" }
        };

        rows.AddRange(data.Select(item => new object?[]
        {
            item.Keyword!.Term,
            item.Year,
            item.PublicationCount,
            item.TrendingScore
        }));

        if (request.Format == ScientificJournal.Common.Enums.ExportFormat.Excel)
        {
            return CreateXlsxWorkbook(rows, "Trend Report");
        }

        var sb = new StringBuilder();
        // Add UTF-8 BOM to support Excel opening Vietnamese characters properly
        sb.Append('\uFEFF');
        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(",", row.Select(EscapeCsvValue)));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsvValue(object? value)
    {
        var text = Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty;
        return $"\"{text.Replace("\"", "\"\"")}\"";
    }

    private static byte[] CreateXlsxWorkbook(IReadOnlyList<IReadOnlyList<object?>> rows, string sheetName)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            AddZipEntry(archive, "[Content_Types].xml", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
                  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
                </Types>
                """);
            AddZipEntry(archive, "_rels/.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
                </Relationships>
                """);
            AddZipEntry(archive, "xl/workbook.xml", $"""
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <sheets><sheet name="{EscapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
                </workbook>
                """);
            AddZipEntry(archive, "xl/_rels/workbook.xml.rels", """
                <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
                </Relationships>
                """);
            AddZipEntry(archive, "xl/worksheets/sheet1.xml", CreateWorksheetXml(rows));
        }

        return stream.ToArray();
    }

    private static string CreateWorksheetXml(IReadOnlyList<IReadOnlyList<object?>> rows)
    {
        var sheetRows = new StringBuilder();
        for (var rowIndex = 0; rowIndex < rows.Count; rowIndex++)
        {
            var rowNumber = rowIndex + 1;
            sheetRows.Append($"""<row r="{rowNumber}">""");
            for (var columnIndex = 0; columnIndex < rows[rowIndex].Count; columnIndex++)
            {
                var cellRef = $"{GetExcelColumnName(columnIndex + 1)}{rowNumber}";
                var cell = rows[rowIndex][columnIndex];
                if (cell is int or long or decimal or double or float)
                {
                    sheetRows.Append($"""<c r="{cellRef}"><v>{Convert.ToString(cell, System.Globalization.CultureInfo.InvariantCulture)}</v></c>""");
                }
                else
                {
                    sheetRows.Append($"""<c r="{cellRef}" t="inlineStr"><is><t>{EscapeXml(Convert.ToString(cell) ?? string.Empty)}</t></is></c>""");
                }
            }
            sheetRows.Append("</row>");
        }

        return $"""
            <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
              <sheetData>{sheetRows}</sheetData>
            </worksheet>
            """;
    }

    private static string GetExcelColumnName(int columnNumber)
    {
        var columnName = string.Empty;
        while (columnNumber > 0)
        {
            var modulo = (columnNumber - 1) % 26;
            columnName = Convert.ToChar('A' + modulo) + columnName;
            columnNumber = (columnNumber - modulo) / 26;
        }

        return columnName;
    }

    private static string EscapeXml(string value) => WebUtility.HtmlEncode(value);

    private static void AddZipEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Fastest);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content.TrimStart());
    }
}

