using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace ScientificJournal.Common.Helpers;

public static class JwtHelper
{
    public static string GenerateAccessToken(int userId, string email, string fullName, string role, string secret, TimeSpan lifetime)
    {
        return GenerateToken(userId, email, fullName, role, secret, lifetime, "access");
    }

    public static string GenerateRefreshToken(int userId, string email, string fullName, string role, string secret, TimeSpan lifetime)
    {
        return GenerateToken(userId, email, fullName, role, secret, lifetime, "refresh");
    }

    public static ClaimsPrincipal ValidateToken(string token, string secret)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = System.Text.Encoding.UTF8.GetBytes(secret);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var principal = tokenHandler.ValidateToken(token, parameters, out var validatedToken);
        if (validatedToken is not JwtSecurityToken jwtToken || jwtToken.Header.Alg != SecurityAlgorithms.HmacSha256)
        {
            throw new SecurityTokenException("Invalid token.");
        }

        return principal;
    }

    private static string GenerateToken(int userId, string email, string fullName, string role, string secret, TimeSpan lifetime, string tokenType)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = System.Text.Encoding.UTF8.GetBytes(secret);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role),
            new("token_type", tokenType),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(lifetime),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
