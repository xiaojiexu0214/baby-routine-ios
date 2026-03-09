import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var settings: AppSettings

    var body: some View {
        NavigationStack {
            Form {
                Toggle("开启提醒", isOn: $settings.reminderEnabled)
                Stepper("奶前提醒：\(settings.feedLeadMinutes) 分钟", value: $settings.feedLeadMinutes, in: 5...30)
                Stepper("清醒窗提醒：\(settings.awakeLeadMinutes) 分钟", value: $settings.awakeLeadMinutes, in: 5...30)
            }
            .navigationTitle("设置")
        }
    }
}
