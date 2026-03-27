using System.Text;

namespace Backend.Infrastructure.Devices;

/// <summary>Потоковое чтение multipart/form-data с ISAPI alertStream (RFC 1867).</summary>
public sealed class IsapiMultipartReader
{
    private readonly Stream _stream;
    private readonly string _boundary;

    public IsapiMultipartReader(Stream stream, string boundary)
    {
        _stream = stream;
        _boundary = boundary;
    }

    public sealed record Part(IReadOnlyDictionary<string, string> Headers, byte[] Body);

    public async Task<Part?> ReadNextPartAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            var line = await ReadLineAsciiAsync(cancellationToken);
            if (line is null)
                return null;

            if (string.IsNullOrEmpty(line))
                continue;

            var open = "--" + _boundary;
            var close = open + "--";
            if (string.Equals(line, close, StringComparison.Ordinal))
                return null;

            if (!string.Equals(line, open, StringComparison.Ordinal))
                continue;

            var headers = await ReadHeaderBlockAsync(cancellationToken);
            if (headers is null)
                return null;

            if (!TryParseContentLength(headers, out var len))
            {
                await SkipToNextPartAsync(cancellationToken);
                continue;
            }

            var body = new byte[len];
            await ReadExactAsync(_stream, body, cancellationToken);
            await TrySkipCrlfAsync(cancellationToken);
            return new Part(headers, body);
        }
    }

    private async Task<IReadOnlyDictionary<string, string>?> ReadHeaderBlockAsync(CancellationToken cancellationToken)
    {
        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        while (true)
        {
            var hLine = await ReadLineAsciiAsync(cancellationToken);
            if (hLine is null)
                return null;
            if (string.IsNullOrEmpty(hLine))
                break;
            var colon = hLine.IndexOf(':');
            if (colon > 0)
                headers[hLine[..colon].Trim()] = hLine[(colon + 1)..].Trim();
        }

        return headers;
    }

    private static bool TryParseContentLength(IReadOnlyDictionary<string, string> headers, out int len)
    {
        len = 0;
        if (!headers.TryGetValue("Content-Length", out var raw))
            return false;
        return int.TryParse(raw.Trim(), out len) && len >= 0;
    }

    /// <summary>После тела части идёт CRLF перед следующей границей.</summary>
    private async Task TrySkipCrlfAsync(CancellationToken cancellationToken)
    {
        var two = new byte[2];
        var got = 0;
        while (got < 2)
        {
            var n = await _stream.ReadAsync(two.AsMemory(got, 2 - got), cancellationToken);
            if (n == 0)
                return;
            got += n;
        }
    }

    private async Task SkipToNextPartAsync(CancellationToken cancellationToken)
    {
        var marker = Encoding.ASCII.GetBytes("\r\n--" + _boundary);
        var i = 0;
        var one = new byte[1];
        while (true)
        {
            var n = await _stream.ReadAsync(one.AsMemory(0, 1), cancellationToken);
            if (n == 0)
                return;
            if (one[0] == marker[i])
            {
                i++;
                if (i == marker.Length)
                    return;
            }
            else
                i = one[0] == marker[0] ? 1 : 0;
        }
    }

    private async Task<string?> ReadLineAsciiAsync(CancellationToken cancellationToken)
    {
        using var ms = new MemoryStream();
        var one = new byte[1];
        while (true)
        {
            var n = await _stream.ReadAsync(one.AsMemory(0, 1), cancellationToken);
            if (n == 0)
                return ms.Length == 0 ? null : TrimCr(Encoding.ASCII.GetString(ms.ToArray()));
            var b = one[0];
            if (b == '\n')
                return TrimCr(Encoding.ASCII.GetString(ms.ToArray()));
            ms.WriteByte(b);
            if (ms.Length > 64 * 1024)
                throw new InvalidDataException("Line too long in multipart stream.");
        }
    }

    private static string TrimCr(string s) =>
        s.Length > 0 && s[^1] == '\r' ? s[..^1] : s;

    private static async Task ReadExactAsync(Stream stream, Memory<byte> buffer, CancellationToken cancellationToken)
    {
        var w = 0;
        while (w < buffer.Length)
        {
            var n = await stream.ReadAsync(buffer[w..], cancellationToken);
            if (n == 0)
                throw new EndOfStreamException();
            w += n;
        }
    }
}
