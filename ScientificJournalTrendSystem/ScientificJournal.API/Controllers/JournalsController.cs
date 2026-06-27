using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ScientificJournal.DataAccess.Entities;
using ScientificJournal.DataAccess.Repositories.Interfaces;

namespace ScientificJournal.API.Controllers;

[ApiController]
[Route("api/journals")]
public class JournalsController : ControllerBase
{
    private readonly IGenericRepository<Journal> _repository;

    public JournalsController(IGenericRepository<Journal> repository)
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
            return NotFound($"Journal with ID '{id}' was not found.");
        }
        return Ok(result);
    }
}
