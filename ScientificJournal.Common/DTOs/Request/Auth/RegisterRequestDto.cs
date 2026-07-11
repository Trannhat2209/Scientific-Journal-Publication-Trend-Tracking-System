namespace ScientificJournal.Common.DTOs.Request.Auth;

public class RegisterRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;

    // Role is intentionally NOT settable at registration anymore: every new account starts
    // as Student. Upgrading to Researcher/Lecturer happens by purchasing a plan
    // (see PaymentsController.ActivatePro), not by free self-selection — and Admin can never
    // be chosen at sign-up at all.
}
