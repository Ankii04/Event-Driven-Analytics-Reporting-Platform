import { Mutation, Resolver } from '@nestjs/graphql';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Resolver()
export class ActionsResolver {
    @Mutation(() => String)
    async triggerSeed(): Promise<string> {
        try {
            const projectRoot = process.cwd() + '/../..';

            // Run seed script in background
            execAsync('npm run seed:events', { cwd: projectRoot }).catch(err =>
                console.error('Seed script error:', err)
            );

            return JSON.stringify({
                success: true,
                message: 'Seeding 1000 events in background...'
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                message: 'Failed to trigger seed: ' + error.message
            });
        }
    }

    @Mutation(() => String)
    async resetData(): Promise<string> {
        try {
            const projectRoot = process.cwd() + '/../..';
            await execAsync('npm run db:reset', { cwd: projectRoot });

            return JSON.stringify({
                success: true,
                message: 'All databases reset successfully'
            });
        } catch (error) {
            return JSON.stringify({
                success: false,
                message: 'Failed to reset: ' + error.message
            });
        }
    }
}
