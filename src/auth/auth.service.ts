import { JwtService } from '@nestjs/jwt'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserRepo } from './typeorm/repositories/user.repository'
import { RegisterDto } from './types/payload/register'
import { LoginDto, Login2Dto } from './types/payload/login'
import { ValidateDto } from './types/payload/validate'
import { JwtPayload } from './types/jwt-payload.interface'
import { User } from './typeorm/entities/user.entity'
import { ChangePasswordDto } from './types/payload/change-password'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepo)
    private userRepo: UserRepo,
    private jwtService: JwtService
  ) {}

  async bootstrap(): Promise<boolean> {
    try {
      await this.userRepo.register({
        username: 'tester',
        password: 'tester54321',
        email: 'tester@tester.com',
        admin: true,
        role: 'Default'
      })
      return true
    } catch (err) {
      return false
    }
  }

  async register(
    authRegisterDto: RegisterDto
  ): Promise<{ username: string; qrCodeUrl: string }> {
    return await this.userRepo.register(authRegisterDto)
  }

  async validateCredentials(
    validateDto: ValidateDto
  ): Promise<{
    username: string
    needs2fa: boolean
    qrCodeUrl?: string
    secret2fa?: string
  }> {
    const user = await this.userRepo.validateCredentials(validateDto)

    if (!user.username) {
      throw new UnauthorizedException('Invalid credentials!')
    }

    return user
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    const payload: JwtPayload = await this.userRepo.validateLogin(loginDto)

    if (!payload.username) {
      throw new UnauthorizedException('Invalid credentials!')
    }

    const token = await this.jwtService.sign(payload)

    return { token }
  }

  async login2(loginDto: Login2Dto): Promise<{ token: string }> {
    const payload: JwtPayload = await this.userRepo.validateLogin2(loginDto)

    if (!payload.username) {
      throw new UnauthorizedException('Invalid credentials!')
    }

    const token = await this.jwtService.sign(payload)

    return { token }
  }

  async getUsers(): Promise<[User[], number]> {
    return await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.username',
        'user.email',
        'user.admin',
        'user.role',
        'user.changePassword',
        'user.needs2fa'
      ])
      .getManyAndCount()
  }

  async updatePassword(
    id: string,
    changePasswordDto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return await this.userRepo.updatePassword(id, changePasswordDto)
  }
}
