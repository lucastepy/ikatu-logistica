import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getGeographicHierarchy() {
  return {
    getDepartamentos: () => prisma.departamento.findMany({
      orderBy: { dep_dsc: 'asc' }
    }),
    
    getDistritos: (depCod: number) => prisma.distrito.findMany({
      where: { dis_dep_cod: depCod },
      orderBy: { dis_dsc: 'asc' }
    }),
    
    getCiudades: (depCod: number, disCod: number) => prisma.ciudad.findMany({
      where: {
        ciu_dep_cod: depCod,
        ciu_dis_cod: disCod
      },
      orderBy: { ciu_dsc: 'asc' }
    }),
    
    getBarrios: (depCod: number, disCod: number, ciuCod: number) => prisma.barrio.findMany({
      where: {
        bar_dep_cod: depCod,
        bar_dis_cod: disCod,
        bar_ciu_cod: ciuCod
      },
      orderBy: { bar_dsc: 'asc' }
    })
  };
}
