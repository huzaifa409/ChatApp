import Foundation

@objc(FileDownloader)
class FileDownloader: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private func localFileURL(for remoteURLString: String) -> URL {
    let safeName = remoteURLString
      .components(separatedBy: CharacterSet(charactersIn: "/:?&="))
      .joined(separator: "_")

    let appSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let mediaDir = appSupportDir.appendingPathComponent("chat_media", isDirectory: true)

    if !FileManager.default.fileExists(atPath: mediaDir.path) {
      try? FileManager.default.createDirectory(at: mediaDir, withIntermediateDirectories: true)
    }

    return mediaDir.appendingPathComponent(safeName)
  }

  @objc
  func downloadFile(_ remoteUrl: String,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {

    guard let url = URL(string: remoteUrl) else {
      reject("BAD_URL", "Invalid URL: \(remoteUrl)", nil)
      return
    }

    let destination = localFileURL(for: remoteUrl)

    if FileManager.default.fileExists(atPath: destination.path) {
      resolve(destination.path)
      return
    }

    let task = URLSession.shared.downloadTask(with: url) { tempLocalURL, response, error in
      if let error = error {
        reject("DOWNLOAD_FAILED", error.localizedDescription, error)
        return
      }
      guard let tempLocalURL = tempLocalURL else {
        reject("DOWNLOAD_FAILED", "No file returned", nil)
        return
      }

      do {
        if FileManager.default.fileExists(atPath: destination.path) {
          try FileManager.default.removeItem(at: destination)
        }
        try FileManager.default.moveItem(at: tempLocalURL, to: destination)
        resolve(destination.path)
      } catch {
        reject("SAVE_FAILED", error.localizedDescription, error)
      }
    }

    task.resume()
  }
}
