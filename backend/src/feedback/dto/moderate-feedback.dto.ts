import { IsIn } from 'class-validator';
import { FeedbackStatuses } from '../../common/admin-domain';

export class ModerateFeedbackDto {
  @IsIn(FeedbackStatuses)
  status: string;
}
