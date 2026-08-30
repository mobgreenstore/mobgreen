import "server-only";

export interface SimulatedCourierProfile {
  id: string;
  displayName: string;
}

export const SIMULATED_COURIER_PROFILES = [
  { id: "courier-mx-97", displayName: "Maxime97" },
  { id: "courier-gv-874", displayName: "Gustavo874" },
  { id: "courier-lk-241", displayName: "Lukas241" },
  { id: "courier-so-508", displayName: "Sofia508" },
  { id: "courier-em-319", displayName: "Emilia319" },
  { id: "courier-mt-762", displayName: "Matteo762" },
  { id: "courier-ln-184", displayName: "Lena184" },
  { id: "courier-hg-635", displayName: "Hugo635" },
  { id: "courier-an-427", displayName: "Ana427" },
  { id: "courier-tm-906", displayName: "Tomas906" },
  { id: "courier-cl-153", displayName: "Clara153" },
  { id: "courier-nk-688", displayName: "Niko688" },
  { id: "courier-el-572", displayName: "Elena572" },
  { id: "courier-jl-834", displayName: "Jules834" },
  { id: "courier-mr-296", displayName: "Marta296" },
  { id: "courier-os-741", displayName: "Oscar741" },
  { id: "courier-iv-365", displayName: "Ivan365" },
  { id: "courier-lu-918", displayName: "Lucia918" },
  { id: "courier-fe-204", displayName: "Felix204" },
  { id: "courier-nr-657", displayName: "Nora657" },
  { id: "courier-th-481", displayName: "Theo481" },
  { id: "courier-al-793", displayName: "Alice793" },
  { id: "courier-jo-126", displayName: "Jonas126" },
  { id: "courier-in-549", displayName: "Ines549" },
  { id: "courier-le-872", displayName: "Leo872" },
  { id: "courier-ml-438", displayName: "Mila438" },
  { id: "courier-ra-615", displayName: "Rafael615" },
  { id: "courier-es-307", displayName: "Elsa307" },
  { id: "courier-no-954", displayName: "Noah954" },
  { id: "courier-zo-268", displayName: "Zoe268" },
] as const satisfies readonly SimulatedCourierProfile[];
