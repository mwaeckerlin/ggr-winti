import {IsOptional, IsString, ValidateIf, IsEnum, IsBoolean, IsNumber} from 'class-validator'

export enum Vorstosstyp {
  MOTION = 'motion',
  INTERPELLATION = 'interpellation',
  POSTULAT = 'postulat',
  ANFRAGE = 'anfrage',
  BESCHLUSSANTRAG = 'beschlussantrag',
  INITIATIVE = 'initiative',
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
  @IsString()
  eingereichtvon?: string
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
}
