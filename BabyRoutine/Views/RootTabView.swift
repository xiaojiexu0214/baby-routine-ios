import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("今天", systemImage: "calendar") }
            AddEventView()
                .tabItem { Label("记录", systemImage: "plus.circle") }
            HistoryView()
                .tabItem { Label("历史", systemImage: "clock.arrow.circlepath") }
            SettingsView()
                .tabItem { Label("设置", systemImage: "gearshape") }
        }
    }
}
