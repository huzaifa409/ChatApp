import Foundation
import React

@objc(DocumentPreviewViewManager)
class DocumentPreviewViewManager: RCTViewManager {
  override func view() -> NSView! {
    return DocumentPreviewView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
