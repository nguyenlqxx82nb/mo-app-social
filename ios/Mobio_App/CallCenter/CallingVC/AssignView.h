//
//  AssignViewController.h
//  Mobio_App
//
//  Created by Lê Quang Nguyên on 4/15/21.
//

#ifndef AssignView_h
#define AssignView_h

#import <UIKit/UIKit.h>
#import "AssignTableViewCell.h"

@protocol AssignViewDelegate <NSObject>
    - (void) didAssignToGroup:(NSString*)groupName;
@end

@interface AssignView : UIView<UITableViewDataSource, UITableViewDelegate>

@property (nonatomic, weak) id <AssignViewDelegate> delegate;

@property(strong, nonatomic) IBOutlet UIView* containerView;
@property(strong, nonatomic) IBOutlet UIView* contentView;
@property(strong, nonatomic) IBOutlet UIButton* btnCall;
@property(strong, nonatomic) IBOutlet UILabel* lblTitle;
@property(strong, nonatomic) IBOutlet UIView* listView;

- (IBAction)btnCloseTapped:(UIButton *)sender;
- (IBAction)btnAssignTapped:(UIButton *)sender;

- (void) setCallId:(NSString*)callId;

@end

#endif /* AssignView_h */
