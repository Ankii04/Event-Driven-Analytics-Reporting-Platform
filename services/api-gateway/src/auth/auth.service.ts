import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    async generateToken(userId: string, email: string): Promise<string> {
        const payload = { sub: userId, email };
        return this.jwtService.sign(payload);
    }

    async validateToken(token: string): Promise<any> {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            return null;
        }
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    async comparePasswords(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    // Mock login for demo purposes
    async login(email: string, password: string): Promise<{ token: string; user: any }> {
        // In production, validate against database
        const user = {
            id: 'user_' + Math.random().toString(36).substr(2, 9),
            email,
        };

        const token = await this.generateToken(user.id, email);

        return { token, user };
    }
}
