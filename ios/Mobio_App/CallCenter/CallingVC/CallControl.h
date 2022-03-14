//
//  CallControl.h
//  CallkitSample
//
//  Created by Lê Quang Nguyên on 2/11/21.
//  Copyright © 2021 Hoang Duoc. All rights reserved.
//

//struct CallControl {
//    var isIncoming = false
//    var isAppToPhone = false
//    var isVideo = false
//
//    var from = ""
//    var to = ""
//    var username = ""
//    var displayName: String {
//        if username.count > 0 {
//            return username
//        } else {
//            return isIncoming ? from : to
//        }
//    }
//
//    var isMute = false
//    var isSpeaker = false
//    var localVideoEnabled = true
//    var signalingState: SignalingState = .calling
//    var mediaState: MediaState = .disconnected
//}

#import <Foundation/Foundation.h>
#import <Stringee/Stringee.h>

@interface CallControl : NSObject

@property(assign, nonatomic) BOOL isIncoming;
@property(assign, nonatomic) BOOL isAppToPhone;
@property(assign, nonatomic) BOOL isVideo;
@property(strong, nonatomic) NSString* from;
@property(strong, nonatomic) NSString* to;
@property(assign, nonatomic) BOOL isMute;
@property(assign, nonatomic) BOOL isSpeaker;
@property(assign, nonatomic) BOOL localVideoEnabled;
@property(assign, nonatomic) SignalingState signalingState;
@property(strong, nonatomic) NSString* userId;
@property(strong, nonatomic) NSString* userAvatar;
@property(strong, nonatomic) NSString* username;
@property(strong, nonatomic) NSString* callId;

- (NSString*) displayName;

@end

