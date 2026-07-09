import Foundation
import Quartz

class DocumentPreviewView: NSView {
  private let previewView = QLPreviewView(frame: .zero, style: .normal)

  @objc var filePath: NSString = "" {
    didSet {
      loadDocument()
    }
  }

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    setupPreviewView()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupPreviewView()
  }

  private func setupPreviewView() {
    previewView?.frame = self.bounds
    previewView?.autoresizingMask = [.width, .height]
    if let previewView = previewView {
      self.addSubview(previewView)
    }
  }

  override func layout() {
    super.layout()
    previewView?.frame = self.bounds
  }

  private func loadDocument() {
    guard filePath.length > 0 else { return }
    let url = URL(fileURLWithPath: filePath as String)
    previewView?.previewItem = url as QLPreviewItem
  }
}
