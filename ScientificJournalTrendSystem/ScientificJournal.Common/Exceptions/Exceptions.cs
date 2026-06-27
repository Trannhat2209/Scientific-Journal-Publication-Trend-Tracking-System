namespace ScientificJournal.Common.Exceptions
{
    // Ném khi không tìm thấy resource → trả về 404
    public class NotFoundException : Exception
    {
        public NotFoundException(string message) : base(message) { }
    }

    // Ném khi không có quyền truy cập → trả về 401/403
    public class UnauthorizedException : Exception
    {
        public UnauthorizedException(string message) : base(message) { }
    }

    // Ném khi vi phạm business rule → trả về 400
    public class BusinessRuleException : Exception
    {
        public BusinessRuleException(string message) : base(message) { }
    }
}
