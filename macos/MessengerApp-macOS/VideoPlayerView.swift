import Foundation
import AVKit
import AVFoundation

class VideoPlayerView: NSView {
  private let playerView = AVPlayerView()
  private var player: AVPlayer?

  @objc var videoPath: NSString = "" {
    didSet {
      loadVideo()
    }
  }

  override init(frame frameRect: NSRect) {
    super.init(frame: frameRect)
    setupPlayerView()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setupPlayerView()
  }

  private func setupPlayerView() {
    playerView.controlsStyle = .default
    playerView.frame = self.bounds
    playerView.autoresizingMask = [.width, .height]
    self.addSubview(playerView)
  }

  override func layout() {
    super.layout()
    playerView.frame = self.bounds
  }

  private func loadVideo() {
    guard videoPath.length > 0 else { return }
    let url = URL(fileURLWithPath: videoPath as String)
    player = AVPlayer(url: url)
    playerView.player = player
  }
}
