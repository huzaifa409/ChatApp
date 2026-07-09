#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <CoreText/CoreText.h>

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"MessengerApp";
  self.initialProps = @{};

  [self registerCustomFonts];

  [super applicationDidFinishLaunching:notification];

  [self.window setMinSize:NSMakeSize(880, 620)];

  // Fix: force a relayout on launch + when un-minimized/reactivated,
  // since RN's layout doesn't recalculate until an actual resize event fires.
  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(nudgeWindowToForceRelayout)
                                                name:NSWindowDidDeminiaturizeNotification
                                              object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                            selector:@selector(nudgeWindowToForceRelayout)
                                                name:NSApplicationDidBecomeActiveNotification
                                              object:nil];

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self nudgeWindowToForceRelayout];
  });
}

- (void)nudgeWindowToForceRelayout
{
  if (!self.window) return;

  NSRect frame = self.window.frame;
  frame.size.width += 1;
  [self.window setFrame:frame display:YES];
  frame.size.width -= 1;
  [self.window setFrame:frame display:YES];
}

- (void)registerCustomFonts
{
  NSArray *fontNames = @[@"Feather"];
  for (NSString *fontName in fontNames) {
    NSString *fontPath = [[NSBundle mainBundle] pathForResource:fontName ofType:@"ttf"];
    if (fontPath) {
      NSURL *fontURL = [NSURL fileURLWithPath:fontPath];
      CFErrorRef error = NULL;
      BOOL success = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)fontURL, kCTFontManagerScopeProcess, &error);
      if (!success) {
        NSLog(@"Failed to register font %@: %@", fontName, error);
      } else {
        NSLog(@"Successfully registered font: %@", fontName);
      }
    } else {
      NSLog(@"Could not find font file for: %@", fontName);
    }
  }
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
