namespace Backend.Application.Parking;

/// <summary>Запрос на решение о въезде: от камеры ANPR, от POS или от внешней интеграции.</summary>
public sealed record ParkingAccessInput(
    string Plate,
    Guid? ZoneId = null,
    string? SpaceType = null,
    string? Camera = null,
    string? Operator = null,
    string? PhotoUrl = null,
    double? Confidence = null,
    bool OpenSession = false);

/// <summary>Решение: пускать ли и почему. Поля повторяют прежний ответ /api/parking/access-decision.</summary>
public sealed record ParkingAccessDecision(
    bool Allowed,
    string Reason,
    string? Category = null,
    string? Subscription = null,
    string? Mode = null,
    string? SubMode = null,
    double? WaitMinutes = null,
    Guid? SessionId = null);

/// <summary>
/// Результат выезда. Closed — сколько сессий закрыто, Amount — зафиксированный долг
/// (выпустили без оплаты). Refused означает, что шлагбаум открывать нельзя:
/// нужно доплатить на кассе, сумма — в SurchargeDue.
/// </summary>
public sealed record ParkingExitResult(
    int Closed,
    decimal Amount,
    Guid? SessionId = null,
    bool Refused = false,
    string? Reason = null,
    decimal SurchargeDue = 0m);

/// <summary>Единая точка принятия решений о въезде/выезде — общая для API, POS и камер ANPR.</summary>
public interface IParkingAccessService
{
    Task<ParkingAccessDecision> DecideAsync(ParkingAccessInput input, CancellationToken cancellationToken);
    /// <param name="force">true — оператор выпускает вручную: сессия закрывается даже без оплаты,
    /// неоплаченная сумма записывается как долг. false (камера) — при неоплате выезд отклоняется.</param>
    Task<ParkingExitResult> RegisterExitAsync(string plate, string? camera, string? photoUrl, bool force, CancellationToken cancellationToken);
    /// <summary>Сколько минут даётся на выезд после оплаты (настройка parking.exitGraceMinutes).</summary>
    Task<int> GetExitGraceMinutesAsync(CancellationToken cancellationToken);
}

/// <summary>Распознанный номер с камеры.</summary>
public sealed record AnprPlateEvent(
    string Plate,
    DateTime OccurredUtc,
    double? Confidence = null,
    string? Country = null,
    /// <summary>Подсказка направления от камеры (forward/reverse), если прошивка её присылает.</summary>
    string? Direction = null);

/// <summary>Обработчик событий ANPR-камер: решает, что делать с распознанным номером.</summary>
public interface IParkingAnprHandler
{
    Task HandlePlateAsync(string deviceIdentifier, AnprPlateEvent plateEvent, CancellationToken cancellationToken);
    /// <summary>Кадр из того же multipart-сообщения: прикрепляем к последнему распознаванию камеры.</summary>
    Task AttachSnapshotAsync(string deviceIdentifier, byte[] image, CancellationToken cancellationToken);
}
