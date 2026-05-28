import { QueryUsersDto } from '../users/dto/query-users.dto';
import { UsersService } from '../users/users.service';
export declare class DevelopersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: QueryUsersDto): Promise<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
