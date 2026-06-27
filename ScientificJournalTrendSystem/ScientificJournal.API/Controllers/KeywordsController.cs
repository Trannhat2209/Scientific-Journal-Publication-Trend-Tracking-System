using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/keywords")]
public class KeywordsController : ControllerBase
{
    private readonly IGenericRepository<Keyword> _repository;

    public KeywordsController(IGenericRepository<Keyword> repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _repository.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _repository.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound($"Keyword with ID '{id}' was not found.");
        }
        return Ok(result);
    }
}
