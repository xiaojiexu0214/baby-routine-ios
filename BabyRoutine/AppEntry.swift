import SwiftUI

@main
struct BabyRoutineApp: App {
    @StateObject private var store = EventStore()
    @StateObject private var settings = AppSettings()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(store)
                .environmentObject(settings)
                .onAppear {
                    NotificationService.shared.requestPermission()
                }
        }
    }
}
