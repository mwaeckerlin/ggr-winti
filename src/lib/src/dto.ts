import {IsOptional, IsString, ValidateIf, IsEnum, IsBoolean, IsNumber, ValidateNested} from 'class-validator'
import {Type} from 'class-transformer'

export enum Vorstosstyp {
  MOTION = 'motion',
  INTERPELLATION = 'interpellation',
  POSTULAT = 'postulat',
  ANFRAGE = 'anfrage',
  BESCHLUSSANTRAG = 'beschlussantrag',
  INITIATIVE = 'initiative',
}

export interface Member {
  vorname: string
  name: string
  partei: string
}

export class MemberDto implements Member {
  @IsOptional()
  @IsString()
  vorname: string = ''

  @IsOptional()
  @IsString()
  name: string = ''

  @IsOptional()
  @IsString()
  partei: string = ''
}

export class GeneratePdfDto {
  @IsEnum(Vorstosstyp)
  vorstosstyp: Vorstosstyp = Vorstosstyp.INTERPELLATION

  @IsOptional()
  @IsBoolean()
  dringlich?: boolean = false

  @IsOptional()
  @IsBoolean()
  budget?: boolean = false

  @IsOptional()
  @IsString()
  betreffend?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => MemberDto)
  eingereichtvon?: Member

  @IsOptional()
  @IsString()
  datum?: string

  @IsOptional()
  @IsString()
  nummer?: string

  @IsOptional()
  @IsNumber()
  unterstuetzer?: number

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.antrag && !o.begruendung)
  text?: string

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.text && o.begroendung)
  antrag?: string

  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.text && o.antrag)
  begruendung?: string

  @IsOptional()
  @IsString()
  einleitung?: string

  @IsOptional()
  @IsString()
  fragen?: string
  
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MemberDto)
  miteinreicher?: Member[]
}
