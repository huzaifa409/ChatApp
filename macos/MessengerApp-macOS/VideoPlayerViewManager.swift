import Foundation
import React

@objc(VideoPlayerViewManager)
class VideoPlayerViewManager: RCTViewManager {
  override func view() -> NSView! {
    return VideoPlayerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
