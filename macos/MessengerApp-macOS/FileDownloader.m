#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FileDownloader, NSObject)

RCT_EXTERN_METHOD(downloadFile:(NSString *)remoteUrl
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
