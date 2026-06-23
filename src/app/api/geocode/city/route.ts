import { NextResponse } from "next/server";
import { getCityCoordinates } from "@/lib/city-geocoding";

type Body = {
  city?: string;
  state?: string;
  ibgeCode?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const city = body.city?.trim();
  const state = body.state?.trim();

  if (!city || !state) {
    return NextResponse.json(
      { error: "Informe cidade e UF para localizar no mapa." },
      { status: 400 },
    );
  }

  try {
    const coordinates = await getCityCoordinates({
      city,
      state,
      ibgeCode: body.ibgeCode,
    });

    return NextResponse.json({
      city,
      state,
      ibgeCode: body.ibgeCode ?? null,
      ...coordinates,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível localizar essa cidade no mapa." },
      { status: 404 },
    );
  }
}
