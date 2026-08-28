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
    decimal SurchargeDue = 0m,
    /// <summary>
    /// Выпустили по белому списку, хотя открытой сессии не было — подрежим
    /// «выезд по списку». Закрывать нечего, но шлагбаум открыть нужно.
    /// </summary>
    bool AllowedWithoutSession = false)
{
    /// <summary>
    /// Открывать ли шлагбаум: закрыта хотя бы одна сессия либо выезд разрешён по списку.
    /// Одно место вместо повторов «Closed &gt; 0» у каждого вызывающего.
    /// </summary>
    public bool BarrierAllowed => !Refused && (Closed > 0 || AllowedWithoutSession);
}

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

/// <summary>
/// Чем закончилась попытка открыть шлагбаум. Skipped — реле не настроено: шлагбаумом
/// управляет сама камера, и это не ошибка. Triggered=false с Error — импульс не прошёл,
/// машина осталась перед закрытым шлагбаумом.
/// </summary>
public sealed record ParkingBarrierResult(
    bool Triggered,
    bool Skipped,
    string? DeviceName = null,
    int? Output = null,
    string? Error = null,
    /// <summary>Чем открыли: "gate" — штатная команда шлагбаума, "io" — импульс на реле.</summary>
    string? Method = null)
{
    public static ParkingBarrierResult NoDevice => new(false, true);
}

/// <summary>
/// Управление шлагбаумом через релейный выход камеры. Единственное место, которое
/// физически открывает проезд: и по решению камеры, и по команде оператора с кассы.
/// </summary>
public interface IParkingBarrierService
{
    /// <summary>Импульс на реле конкретной камеры. reason попадает в журнал при ошибке.</summary>
    Task<ParkingBarrierResult> TriggerAsync(Guid deviceId, string reason, string? plate, CancellationToken cancellationToken);

    /// <summary>
    /// Открыть шлагбаум нужного направления: камера с настроенным реле, по возможности
    /// в той же зоне. Нужно, когда проезд оформил оператор, а не камера.
    /// </summary>
    Task<ParkingBarrierResult> OpenAsync(
        Backend.Domain.Entities.ParkingCameraDirection direction,
        Guid? zoneId,
        string? plate,
        string? source,
        CancellationToken cancellationToken);
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
