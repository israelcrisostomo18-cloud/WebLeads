import { handleLeadSearch } from "@/app/api/osm/search/route";

export async function POST(request: Request) {
  return handleLeadSearch(request, "private");
}
