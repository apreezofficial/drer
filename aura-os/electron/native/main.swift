import Foundation
import EventKit
import AppKit

struct Request: Decodable {
    var operation: String
    var title: String?
    var dueAt: String?
    var startAt: String?
    var endAt: String?
    var identifier: String?
    var application: String?
}
func date(_ value: String?) throws -> Date {
    guard let value else { throw NSError(domain:"DRER",code:1,userInfo:[NSLocalizedDescriptionKey:"A date is required."]) }
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    if let result = formatter.date(from:value) { return result }
    formatter.formatOptions = [.withInternetDateTime]
    guard let result = formatter.date(from:value) else { throw NSError(domain:"DRER",code:1,userInfo:[NSLocalizedDescriptionKey:"Invalid date."]) }
    return result
}
func emit(_ result: [String:Any], code:Int32 = 0) -> Never {
    if let data=try? JSONSerialization.data(withJSONObject:result,options:[.sortedKeys]),let text=String(data:data,encoding:.utf8) { print(text) }
    exit(code)
}
let store = EKEventStore()
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
Task { @MainActor in
    do {
        let bytes=FileHandle.standardInput.readDataToEndOfFile()
        let request=try JSONDecoder().decode(Request.self,from:bytes)
        if request.operation == "list-apps" || request.operation == "open-app" {
            var applications: [(name:String,url:URL)] = []
            let roots=["/Applications","/System/Applications",NSHomeDirectory()+"/Applications"]
            for root in roots {
                let base=URL(fileURLWithPath:root)
                guard let enumerator=FileManager.default.enumerator(at:base,includingPropertiesForKeys:nil,options:[.skipsHiddenFiles]) else { continue }
                for case let url as URL in enumerator {
                    if url.pathExtension.lowercased() == "app" {
                        let bundle=Bundle(url:url)
                        let name=(bundle?.object(forInfoDictionaryKey:"CFBundleDisplayName") as? String) ?? (bundle?.object(forInfoDictionaryKey:"CFBundleName") as? String) ?? url.deletingPathExtension().lastPathComponent
                        applications.append((name,url));enumerator.skipDescendants()
                    } else if url.pathComponents.count > base.pathComponents.count+3 { enumerator.skipDescendants() }
                }
            }
            if request.operation == "list-apps" { emit(["ok":true,"applications":applications.map{["name":$0.name]}]) }
            let query=(request.application ?? "").lowercased().filter{$0.isLetter || $0.isNumber}
            guard !query.isEmpty else { throw NSError(domain:"DRER",code:8,userInfo:[NSLocalizedDescriptionKey:"Tell me which app to open."]) }
            let ranked=applications.map { item -> (String,URL,Int) in
                let name=item.name.lowercased().filter{$0.isLetter || $0.isNumber}
                let file=item.url.deletingPathExtension().lastPathComponent.lowercased().filter{$0.isLetter || $0.isNumber}
                let score=(name==query || file==query) ? 100 : (name.contains(query) || file.contains(query)) ? 50 : 0
                return (item.name,item.url,score)
            }.filter{$0.2>0}.sorted{$0.2>$1.2}
            guard let target=ranked.first else { throw NSError(domain:"DRER",code:9,userInfo:[NSLocalizedDescriptionKey:"I could not find an installed app named "+(request.application ?? "that")+"."]) }
            if ranked.count>1 && ranked[0].2==ranked[1].2 { throw NSError(domain:"DRER",code:10,userInfo:[NSLocalizedDescriptionKey:"More than one installed app matches. Use the full app name: "+ranked.prefix(4).map{$0.0}.joined(separator:", ")]) }
            _ = try await NSWorkspace.shared.openApplication(at:target.1,configuration:NSWorkspace.OpenConfiguration())
            emit(["ok":true,"application":target.0,"opened":true])
        }
        if request.operation == "status" {
            emit(["ok":true,"reminders":EKEventStore.authorizationStatus(for:.reminder).rawValue,"calendar":EKEventStore.authorizationStatus(for:.event).rawValue])
        }
        if ["reminder","read-reminder","complete-reminder","authorize-reminders"].contains(request.operation) {
            guard try await store.requestFullAccessToReminders() else { throw NSError(domain:"DRER",code:2,userInfo:[NSLocalizedDescriptionKey:"macOS Reminders access was not granted. Enable DRER in Privacy & Security → Reminders."]) }
            if request.operation == "authorize-reminders" { emit(["ok":true,"service":"Apple Reminders","authorized":true]) }
            if request.operation == "reminder" {
                guard let calendar=store.defaultCalendarForNewReminders() else { throw NSError(domain:"DRER",code:3,userInfo:[NSLocalizedDescriptionKey:"Apple Reminders has no default list. Open Reminders and create a list first."]) }
                let reminder=EKReminder(eventStore:store)
                reminder.title=request.title ?? "DRER reminder"
                reminder.calendar=calendar
                let due=try date(request.dueAt)
                var components=Calendar.current.dateComponents([.year,.month,.day,.hour,.minute,.second],from:due)
                components.timeZone=TimeZone.current
                reminder.dueDateComponents=components
                reminder.addAlarm(EKAlarm(absoluteDate:due))
                try store.save(reminder,commit:true)
                guard let saved=store.calendarItem(withIdentifier:reminder.calendarItemIdentifier) as? EKReminder else { throw NSError(domain:"DRER",code:4,userInfo:[NSLocalizedDescriptionKey:"The reminder could not be verified in Apple Reminders."]) }
                emit(["ok":true,"service":"Apple Reminders","identifier":saved.calendarItemIdentifier,"title":saved.title ?? "","dueAt":request.dueAt ?? "","verified":true])
            }
            guard let identifier=request.identifier,let reminder=store.calendarItem(withIdentifier:identifier) as? EKReminder else { throw NSError(domain:"DRER",code:5,userInfo:[NSLocalizedDescriptionKey:"That native reminder was not found."]) }
            if request.operation == "complete-reminder" { reminder.isCompleted=true;try store.save(reminder,commit:true) }
            emit(["ok":true,"service":"Apple Reminders","identifier":reminder.calendarItemIdentifier,"title":reminder.title ?? "","completed":reminder.isCompleted,"verified":true])
        }
        if ["calendar-event", "authorize-calendar"].contains(request.operation) {
            guard try await store.requestWriteOnlyAccessToEvents() else { throw NSError(domain:"DRER",code:2,userInfo:[NSLocalizedDescriptionKey:"macOS Calendar access was not granted."]) }
            if request.operation == "authorize-calendar" { emit(["ok":true,"service":"Apple Calendar","authorized":true]) }
            guard let calendar=store.defaultCalendarForNewEvents else { throw NSError(domain:"DRER",code:3,userInfo:[NSLocalizedDescriptionKey:"Calendar has no default calendar. Open Calendar and finish its setup first."]) }
            let event=EKEvent(eventStore:store)
            event.title=request.title ?? "DRER event"
            event.startDate=try date(request.startAt)
            event.endDate=try date(request.endAt)
            event.calendar=calendar
            event.addAlarm(EKAlarm(relativeOffset:-300))
            try store.save(event,span:.thisEvent,commit:true)
            emit(["ok":true,"service":"Apple Calendar","identifier":event.eventIdentifier ?? "","title":event.title ?? "","startAt":request.startAt ?? "","endAt":request.endAt ?? ""])
        }
        throw NSError(domain:"DRER",code:6,userInfo:[NSLocalizedDescriptionKey:"Unsupported native operation."])
    } catch { emit(["ok":false,"error":error.localizedDescription],code:1) }
}
app.run()
