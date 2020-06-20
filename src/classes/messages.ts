//
// Author:  Matt Lavery
// Date:    2020-06-20
// Purpose: Helpers for common messages
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

export class MessageHelper {
    
    prcommentautomationwelcome : string;
    prcommentautomationdirtypr : string;


    constructor() {
        this.prcommentautomationwelcome = "# Tip\n\nWhen you are ready for your PR to be processed, mark the PR ready by commenting with `#pr-ready`.\n\nIf you still have work to do, even after marking this ready, you can pu the PR on hold by commenting with `#pr-onhold`.";
        this.prcommentautomationdirtypr = "Pull request is not mergable, please resolve any conflicts/issues first";
        
    }
}
