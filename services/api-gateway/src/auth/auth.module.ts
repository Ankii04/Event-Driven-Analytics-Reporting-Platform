import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
            signOptions: {
                expiresIn: process.env.JWT_EXPIRATION || '24h',
            },
        }),
    ],
    providers: [AuthService, AuthResolver, JwtStrategy],
    exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }
