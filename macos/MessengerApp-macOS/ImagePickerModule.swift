import Foundation
import AppKit
import React

@objc(ImagePickerModule)
class ImagePickerModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private func openPanel(allowedTypes: [String], title: String,
                         resolve: @escaping RCTPromiseResolveBlock,
                         reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let panel = NSOpenPanel()
      panel.title = title
      panel.allowsMultipleSelection = true
      panel.canChooseDirectories = false
      panel.canChooseFiles = true
      panel.allowedFileTypes = allowedTypes

      panel.begin { response in
        if response == .OK && !panel.urls.isEmpty {
          let paths = panel.urls.map { $0.path }
          resolve(paths)
        } else {
          let error = NSError(domain: "ImagePicker", code: 0, userInfo: nil)
          reject("CANCELLED", "User cancelled selection", error)
        }
      }
    }
  }

  @objc
  func pickImage(_ resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    openPanel(allowedTypes: ["jpg", "jpeg", "png", "gif", "heic", "bmp", "tiff"],
              title: "Choose Pictures", resolve: resolve, reject: reject)
  }

  @objc
  func pickVideo(_ resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    openPanel(allowedTypes: ["mp4", "mov", "m4v", "avi", "mkv"],
              title: "Choose Videos", resolve: resolve, reject: reject)
  }

  @objc
  func pickDocument(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    openPanel(allowedTypes: ["pdf", "doc", "docx", "txt", "xlsx", "ppt", "pptx", "csv"],
              title: "Choose Documents", resolve: resolve, reject: reject)
  }

  @objc
  func openFile(_ path: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let success = NSWorkspace.shared.open(URL(fileURLWithPath: path))
      resolve(success)
    }
  }
}
