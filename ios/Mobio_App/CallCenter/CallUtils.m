//
//  CallUtils.m
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 2/20/21.
//

#import "CallUtils.h"

@implementation CallUtils

+ (NSString*) formatPhone: (NSString*) phoneNumber {
  if (!phoneNumber) {
    return @"";
  }
  NSString* phone = [phoneNumber stringByReplacingOccurrencesOfString:@"+84"
                                       withString:@"0"];
  long length = phone.length;
  if (length < 6) {
    return phone;
  }
  if (length == 7) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{3})(\\d{4})"
                                                     withString:@"$1 $2"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  if (length == 8) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{4})(\\d{4})"
                                                     withString:@"$1 $2"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  if (length == 9) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{3})(\\d{3})(\\d{3})"
                                                     withString:@"$1 $2 $3"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  if (length == 10) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{3})(\\d{3})(\\d{4})"
                                                     withString:@"$1 $2 $3"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  if (length == 11) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{4})(\\d{3})(\\d{4})"
                                                     withString:@"$1 $2 $3"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  if (length == 12) {
    return [phone stringByReplacingOccurrencesOfString:@"(\\d{4})(\\d{4})(\\d{4})"
                                                     withString:@"$1 $2 $3"
                                                        options:NSRegularExpressionSearch
                                                          range:NSMakeRange(0, [phone length])];;
  }
  return phone;
}

+ (NSString *)convertDataToHexStr:(NSData *)data
{
  if (!data || [data length] == 0) {
    return @"";
  }
  NSMutableString *string = [[NSMutableString alloc] initWithCapacity:[data length]];
   
  [data enumerateByteRangesUsingBlock:^(const void *bytes, NSRange byteRange, BOOL *stop) {
    unsigned char *dataBytes = (unsigned char*)bytes;
    for (NSInteger i = 0; i < byteRange.length; i++) {
      NSString *hexStr = [NSString stringWithFormat:@"%x", (dataBytes[i]) & 0xff];
      if ([hexStr length] == 2) {
        [string appendString:hexStr];
      } else {
        [string appendFormat:@"0%@", hexStr];
      }
    }
  }];
  return string;
}

+ (BOOL) isNull: (id) object
{
    if (object == nil || object == (id)[NSNull null])
    {
        return YES;
    }
    return NO;
}

+ (void)delayCallback:(void(^)(void))callback forTotalSeconds:(double)delayInSeconds {
  dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, delayInSeconds * NSEC_PER_SEC);
  dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
    if(callback){
      callback();
    }
  });
}

+ (NSString*) getAccessToken {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* accessToken = [prefs valueForKey:@"ACCESS_TOKEN"];
  NSLog(@"getAccessToken0 = %@", accessToken);
  if (accessToken == nil) {
    return nil;
  }
  NSLog(@"getAccessToken1");
  BOOL isExpired = [CallUtils checkIfAccessTokenExpired:accessToken];
  //NSLog(@"getAccessToken isExpired = %@", isExpired == YES? "True ": "Fa lse");
  if (!isExpired) {
    return accessToken;
  }
  return nil;
}

+ (BOOL) checkIfAccessTokenExpired: (NSString*) accessToken {
  NSArray *tokenArr = [accessToken componentsSeparatedByString: @"."];
  // NSLog(@"checkIfAccessTokenExpired = %@", [[NSNumber numberWithInt:tokenArr.count] stringValue]);
  if (tokenArr.count <= 2) {
    return false;
  }
  // NSData from the Base64 encoded str
  NSData *decodedData = [[NSData alloc]initWithBase64EncodedString:tokenArr[1] options:NSDataBase64DecodingIgnoreUnknownCharacters];
  //NSLog(@"checkIfAccessTokenExpired decodedData = %@ tokenArr[1] = %@", decodedData, tokenArr[1]);
  if (decodedData == nil) {
    return false;
  }
  NSString *decodedString = [[NSString alloc] initWithData:decodedData encoding:NSUTF8StringEncoding];
  id dict = [NSJSONSerialization JSONObjectWithData:decodedData options:0 error:nil];
  // NSLog(@"checkIfAccessTokenExpired dict = %@", dict);
  NSNumber* expNum = dict[@"exp"];
  double exp = [expNum doubleValue];
  double now = [[NSDate date] timeIntervalSince1970];
  
  double deltal = exp - now ;
  
  NSLog(@"checkIfAccessTokenExpired decodedString = %@ exp=%@ now=%@ deltal= %@ ", decodedString, [[NSNumber numberWithDouble:exp] stringValue] , [[NSNumber numberWithDouble:now] stringValue] , [[NSNumber numberWithDouble:deltal] stringValue]);
  if (deltal <= 10) {
    return  true;
  }
  return false;
}

+ (void) fetchAccessToken {
  NSUserDefaults* prefs = [NSUserDefaults standardUserDefaults];
  NSString* host = [prefs valueForKey:@"HOST_CALL_CENTER"];
  NSString* merchantId = [prefs valueForKey:@"MERCHANT_ID"];
  NSString* token = [prefs valueForKey:@"TOKEN"];
  NSString* staff_id = [prefs valueForKey:@"STAFF_ID"];
  NSString* urlString = [NSString stringWithFormat:@"%@app/access_token", host];
  token = [NSString stringWithFormat:@"Bearer %@", token];
  NSURL *url = [NSURL URLWithString:urlString];
  NSMutableURLRequest *request = [[NSMutableURLRequest alloc] initWithURL:url];

  [request setHTTPMethod:@"POST"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Accept"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  [request setValue:token forHTTPHeaderField:@"Authorization"];
  // [request setValue:merchantId forHTTPHeaderField:@"X-Merchant-ID"];

  NSMutableDictionary *contentDictionary = [[NSMutableDictionary alloc]init];
  [contentDictionary setValue:@"1" forKey:@"type"];
  [contentDictionary setValue:staff_id forKey:@"staff_id"];
  [contentDictionary setValue:merchantId forKey:@"merchant_id"];

  NSData *data = [NSJSONSerialization dataWithJSONObject:contentDictionary options:NSJSONWritingPrettyPrinted error:nil];
  NSString *postLength = [NSString stringWithFormat:@"%d", [data length]];
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];

  NSString *jsonStr = [[NSString alloc] initWithData:data
                                            encoding:NSUTF8StringEncoding];
  NSLog(@"fetchAccessToken urlString %@ , jsonStr = %@ postLength = %@ staff_id = %@",urlString, jsonStr, postLength, staff_id);
  [request setHTTPBody:data];
  [[[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:
    ^(NSData * _Nullable data,
      NSURLResponse * _Nullable response,
      NSError * _Nullable error) {
    if (error) {
      NSLog(@"fetchAccessToken error = %@", error);
      return;
    }
    NSError *jsonError = nil;
    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
    NSObject* responseData = dictionary[@"data"];
    NSLog(@"responseData data = %@", dictionary);
  }] resume];
}

@end
