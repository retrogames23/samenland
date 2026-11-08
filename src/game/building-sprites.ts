import { seasonalImage } from "./season-art";
import waterWheelUrl from "@/assets/sprites/water-wheel.webp";
import campfire from "@/assets/sprites/campfire.webp";
import hut from "@/assets/sprites/cohesive/grain-hut.webp";
import coop from "@/assets/sprites/coop.webp";
import fence from "@/assets/sprites/fence.webp";
import chapel from "@/assets/sprites/cohesive/chapel.webp";
import watermill from "@/assets/sprites/cohesive/watermill.webp";
import harbor from "@/assets/sprites/cohesive/harbor.webp";
import stall from "@/assets/sprites/stall.webp";
import townhall from "@/assets/sprites/cohesive/townhall.webp";
import seat1 from "@/assets/sprites/cohesive/seat1.webp";
import seat2 from "@/assets/sprites/cohesive/seat2.webp";
import seat3 from "@/assets/sprites/cohesive/seat3.webp";
import seat1Light from "@/assets/sprites/cohesive/night/seat1.webp";
import seat2Light from "@/assets/sprites/cohesive/night/seat2.webp";
import seat3Light from "@/assets/sprites/cohesive/night/seat3.webp";
import manufactory from "@/assets/sprites/cohesive/manufactory.webp";
import steamworks from "@/assets/sprites/cohesive/steamworks.webp";
import station from "@/assets/sprites/cohesive/station.webp";
// suburb homes reuse the Hanseatic gabled house art (the old villa sprite was 19th-century)
import farmhouse from "@/assets/sprites/cohesive/grain-farmhouse.webp";
import cottage from "@/assets/sprites/cohesive/grain-cottage.webp";
import barn from "@/assets/sprites/cohesive/grain-barn.webp";
import church from "@/assets/sprites/cohesive/church.webp";
import mill from "@/assets/sprites/cohesive/mill.webp";
import millSails from "@/assets/sprites/mill-sails.webp";
import inn from "@/assets/sprites/cohesive/inn.webp";
import bakery from "@/assets/sprites/cohesive/bakery.webp";
import townhouse from "@/assets/sprites/cohesive/townhouse.webp";
import townhouse2 from "@/assets/sprites/cohesive/townhouse2.webp";
import patrician from "@/assets/sprites/cohesive/grain-patrician.webp";
import fachwerk from "@/assets/sprites/cohesive/grain-fachwerk.webp";
import steinhaus from "@/assets/sprites/cohesive/grain-steinhaus.webp";
import handwerker from "@/assets/sprites/cohesive/grain-handwerker.webp";
import villa from "@/assets/sprites/cohesive/grain-villa.webp";
import tenement from "@/assets/sprites/cohesive/tenement.webp";
import workshop from "@/assets/sprites/cohesive/workshop.webp";
import smithy from "@/assets/sprites/cohesive/smithy.webp";
import warehouse from "@/assets/sprites/cohesive/warehouse.webp";
import factory from "@/assets/sprites/cohesive/cathedral.webp";
import sawmill from "@/assets/sprites/cohesive/sawmill.webp";
import well from "@/assets/sprites/cohesive/well.webp";
import market from "@/assets/sprites/market.webp";
import hay from "@/assets/sprites/hay.webp";
import fishery from "@/assets/sprites/cohesive/fishery.webp";
import granary from "@/assets/sprites/cohesive/granary.webp";
import infirmary from "@/assets/sprites/cohesive/infirmary.webp";
import firehouse from "@/assets/sprites/cohesive/firehouse.webp";
import guardhouse from "@/assets/sprites/cohesive/guardhouse.webp";
import school from "@/assets/sprites/cohesive/school.webp";
import belfry from "@/assets/sprites/cohesive/belfry.webp";
import theater from "@/assets/sprites/cohesive/theater.webp";
import theaterLight from "@/assets/sprites/cohesive/night/theater.webp";
import opera from "@/assets/sprites/cohesive/opera.webp";
import operaLight from "@/assets/sprites/cohesive/night/opera.webp";
import university from "@/assets/sprites/cohesive/university.webp";
import universityLight from "@/assets/sprites/cohesive/night/university.webp";
import exchange from "@/assets/sprites/cohesive/exchange.webp";
import exchangeLight from "@/assets/sprites/cohesive/night/exchange.webp";
import harvesthall from "@/assets/sprites/cohesive/harvesthall.webp";
import guildtower from "@/assets/sprites/cohesive/guildtower.webp";
import lighthouse from "@/assets/sprites/cohesive/lighthouse.webp";
import harvesthallLight from "@/assets/sprites/cohesive/night/harvesthall.webp";
import guildtowerLight from "@/assets/sprites/cohesive/night/guildtower.webp";
import lighthouseLight from "@/assets/sprites/cohesive/night/lighthouse.webp";
import orangery from "@/assets/sprites/cohesive/orangery.webp";
import orangeryLight from "@/assets/sprites/cohesive/night/orangery.webp";
import markethall from "@/assets/sprites/cohesive/markethall.webp";
import gatehouse from "@/assets/sprites/cohesive/gatehouse.webp";
import guildhall from "@/assets/sprites/cohesive/guildhall.webp";
import library from "@/assets/sprites/cohesive/library.webp";
import dairy from "@/assets/sprites/cohesive/dairy.webp";
import type { Kind } from "./world";

import bakeryLight from "@/assets/sprites/cohesive/night/bakery.webp";
import barnLight from "@/assets/sprites/cohesive/night/grain-barn.webp";
import chapelLight from "@/assets/sprites/cohesive/night/chapel.webp";
import churchLight from "@/assets/sprites/cohesive/night/church.webp";
import cottageLight from "@/assets/sprites/cohesive/night/grain-cottage.webp";
import dairyLight from "@/assets/sprites/cohesive/night/dairy.webp";
import factoryLight from "@/assets/sprites/cohesive/night/cathedral.webp";
import farmhouseLight from "@/assets/sprites/cohesive/night/grain-farmhouse.webp";
import fisheryLight from "@/assets/sprites/cohesive/night/fishery.webp";
import lodge from "@/assets/sprites/cohesive/lodge.webp";
import herbhut from "@/assets/sprites/cohesive/herbhut.webp";
import backhausLight from "@/assets/sprites/cohesive/night/backhaus.webp";
import herbergeLight from "@/assets/sprites/cohesive/night/herberge.webp";
import beginenhofLight from "@/assets/sprites/cohesive/night/beginenhof.webp";
import badestubeLight from "@/assets/sprites/cohesive/night/badestube.webp";
import badestubeImg from "@/assets/sprites/cohesive/badestube.webp";
import backhausImg from "@/assets/sprites/cohesive/backhaus.webp";
import herbergeImg from "@/assets/sprites/cohesive/herberge.webp";
import beginenhofImg from "@/assets/sprites/cohesive/beginenhof.webp";
import bigstoreImg from "@/assets/sprites/cohesive/bigstore.webp";
import bigstoreLight from "@/assets/sprites/cohesive/night/bigstore.webp";
import millrowImg from "@/assets/sprites/cohesive/millrow.webp";
import millrowLight from "@/assets/sprites/cohesive/night/millrow.webp";
import stonemasonImg from "@/assets/sprites/cohesive/stonemason.webp";
import stonemasonLight from "@/assets/sprites/cohesive/night/stonemason.webp";
import hammerworksImg from "@/assets/sprites/cohesive/hammerworks.webp";
import hammerworksLight from "@/assets/sprites/cohesive/night/hammerworks.webp";
import smokehouseImg from "@/assets/sprites/cohesive/smokehouse.webp";
import smokehouseLight from "@/assets/sprites/cohesive/night/smokehouse.webp";
import saltquayImg from "@/assets/sprites/cohesive/saltquay.webp";
import saltquayLight from "@/assets/sprites/cohesive/night/saltquay.webp";
import woodcamp from "@/assets/sprites/cohesive/woodcamp.webp";
import lodgeLight from "@/assets/sprites/cohesive/night/lodge.webp";
import herbhutLight from "@/assets/sprites/cohesive/night/herbhut.webp";
import woodcampLight from "@/assets/sprites/cohesive/night/woodcamp.webp";
import granaryLight from "@/assets/sprites/cohesive/night/granary.webp";
import guildhallLight from "@/assets/sprites/cohesive/night/guildhall.webp";
import harborLight from "@/assets/sprites/cohesive/night/harbor.webp";
import hutLight from "@/assets/sprites/cohesive/night/grain-hut.webp";
import infirmaryLight from "@/assets/sprites/cohesive/night/infirmary.webp";
import firehouseLight from "@/assets/sprites/cohesive/night/firehouse.webp";
import guardhouseLight from "@/assets/sprites/cohesive/night/guardhouse.webp";
import innLight from "@/assets/sprites/cohesive/night/inn.webp";
import libraryLight from "@/assets/sprites/cohesive/night/library.webp";
import manufactoryLight from "@/assets/sprites/cohesive/night/manufactory.webp";
import markethallLight from "@/assets/sprites/cohesive/night/markethall.webp";
import millLight from "@/assets/sprites/cohesive/night/mill.webp";
import sawmillLight from "@/assets/sprites/cohesive/night/sawmill.webp";
import schoolLight from "@/assets/sprites/cohesive/night/school.webp";
import belfryLight from "@/assets/sprites/cohesive/night/belfry.webp";
import smithyLight from "@/assets/sprites/cohesive/night/smithy.webp";
import stationLight from "@/assets/sprites/cohesive/night/station.webp";
import steamworksLight from "@/assets/sprites/cohesive/night/steamworks.webp";

import townhallLight from "@/assets/sprites/cohesive/night/townhall.webp";
import fachwerkLight from "@/assets/sprites/cohesive/night/grain-fachwerk.webp";
import steinhausLight from "@/assets/sprites/cohesive/night/grain-steinhaus.webp";
import handwerkerLight from "@/assets/sprites/cohesive/night/grain-handwerker.webp";
import townhouseLight from "@/assets/sprites/cohesive/night/townhouse.webp";
import townhouse2Light from "@/assets/sprites/cohesive/night/townhouse2.webp";
import patricianLight from "@/assets/sprites/cohesive/night/grain-patrician.webp";
import villaLight from "@/assets/sprites/cohesive/night/grain-villa.webp";
import tenementLight from "@/assets/sprites/cohesive/night/tenement.webp";
import gatehouseLight from "@/assets/sprites/cohesive/night/gatehouse.webp";
import warehouseLight from "@/assets/sprites/cohesive/night/warehouse.webp";
import watermillLight from "@/assets/sprites/cohesive/night/watermill.webp";
import workshopLight from "@/assets/sprites/cohesive/night/workshop.webp";

import cottageHill from "@/assets/sprites/cohesive/workshop-cottage.webp";
import fachwerkHill from "@/assets/sprites/cohesive/workshop-fachwerk.webp";
import patricianHill from "@/assets/sprites/cohesive/workshop-patrician.webp";
import cottageCoast from "@/assets/sprites/cohesive/gateway-cottage.webp";
import fachwerkCoast from "@/assets/sprites/cohesive/gateway-fachwerk.webp";
import patricianCoast from "@/assets/sprites/cohesive/gateway-patrician.webp";
import cottageHillLight from "@/assets/sprites/cohesive/night/workshop-cottage.webp";
import fachwerkHillLight from "@/assets/sprites/cohesive/night/workshop-fachwerk.webp";
import patricianHillLight from "@/assets/sprites/cohesive/night/workshop-patrician.webp";
import cottageCoastLight from "@/assets/sprites/cohesive/night/gateway-cottage.webp";
import fachwerkCoastLight from "@/assets/sprites/cohesive/night/gateway-fachwerk.webp";
import patricianCoastLight from "@/assets/sprites/cohesive/night/gateway-patrician.webp";
import hutHill from "@/assets/sprites/cohesive/workshop-hut.webp";
import hutCoast from "@/assets/sprites/cohesive/gateway-hut.webp";
import craftHill from "@/assets/sprites/cohesive/workshop-handwerker.webp";
import craftCoast from "@/assets/sprites/cohesive/gateway-handwerker.webp";
import farmHill from "@/assets/sprites/cohesive/workshop-farmhouse.webp";
import farmCoast from "@/assets/sprites/cohesive/gateway-farmhouse.webp";
import hutHillLight from "@/assets/sprites/cohesive/night/workshop-hut.webp";
import hutCoastLight from "@/assets/sprites/cohesive/night/gateway-hut.webp";
import craftHillLight from "@/assets/sprites/cohesive/night/workshop-handwerker.webp";
import craftCoastLight from "@/assets/sprites/cohesive/night/gateway-handwerker.webp";
import farmHillLight from "@/assets/sprites/cohesive/night/workshop-farmhouse.webp";
import farmCoastLight from "@/assets/sprites/cohesive/night/gateway-farmhouse.webp";
import barnHill from "@/assets/sprites/cohesive/workshop-barn.webp";
import barnCoast from "@/assets/sprites/cohesive/gateway-barn.webp";
import barnHillLight from "@/assets/sprites/cohesive/night/workshop-barn.webp";
import barnCoastLight from "@/assets/sprites/cohesive/night/gateway-barn.webp";
import steinHill from "@/assets/sprites/cohesive/workshop-steinhaus.webp";
import steinCoast from "@/assets/sprites/cohesive/gateway-steinhaus.webp";
import steinHillLight from "@/assets/sprites/cohesive/night/workshop-steinhaus.webp";
import steinCoastLight from "@/assets/sprites/cohesive/night/gateway-steinhaus.webp";
import villaHill from "@/assets/sprites/cohesive/workshop-villa.webp";
import villaCoast from "@/assets/sprites/cohesive/gateway-villa.webp";
import villaHillLight from "@/assets/sprites/cohesive/night/workshop-villa.webp";
import villaCoastLight from "@/assets/sprites/cohesive/night/gateway-villa.webp";

import grainFarmhouse2 from "@/assets/sprites/cohesive/grain-farmhouse-2.webp";
import grainFarmhouse2Light from "@/assets/sprites/cohesive/night/grain-farmhouse-2.webp";
import grainFarmhouse3 from "@/assets/sprites/cohesive/grain-farmhouse-3.webp";
import grainFarmhouse3Light from "@/assets/sprites/cohesive/night/grain-farmhouse-3.webp";
import workshopFarmhouse2 from "@/assets/sprites/cohesive/workshop-farmhouse-2.webp";
import workshopFarmhouse2Light from "@/assets/sprites/cohesive/night/workshop-farmhouse-2.webp";
import workshopFarmhouse3 from "@/assets/sprites/cohesive/workshop-farmhouse-3.webp";
import workshopFarmhouse3Light from "@/assets/sprites/cohesive/night/workshop-farmhouse-3.webp";
import gatewayFarmhouse2 from "@/assets/sprites/cohesive/gateway-farmhouse-2.webp";
import gatewayFarmhouse2Light from "@/assets/sprites/cohesive/night/gateway-farmhouse-2.webp";
import gatewayFarmhouse3 from "@/assets/sprites/cohesive/gateway-farmhouse-3.webp";
import gatewayFarmhouse3Light from "@/assets/sprites/cohesive/night/gateway-farmhouse-3.webp";
import grainCottage2 from "@/assets/sprites/cohesive/grain-cottage-2.webp";
import grainCottage2Light from "@/assets/sprites/cohesive/night/grain-cottage-2.webp";
import grainCottage3 from "@/assets/sprites/cohesive/grain-cottage-3.webp";
import grainCottage3Light from "@/assets/sprites/cohesive/night/grain-cottage-3.webp";
import workshopCottage2 from "@/assets/sprites/cohesive/workshop-cottage-2.webp";
import workshopCottage2Light from "@/assets/sprites/cohesive/night/workshop-cottage-2.webp";
import workshopCottage3 from "@/assets/sprites/cohesive/workshop-cottage-3.webp";
import workshopCottage3Light from "@/assets/sprites/cohesive/night/workshop-cottage-3.webp";
import gatewayCottage2 from "@/assets/sprites/cohesive/gateway-cottage-2.webp";
import gatewayCottage2Light from "@/assets/sprites/cohesive/night/gateway-cottage-2.webp";
import gatewayCottage3 from "@/assets/sprites/cohesive/gateway-cottage-3.webp";
import gatewayCottage3Light from "@/assets/sprites/cohesive/night/gateway-cottage-3.webp";

import grainHandwerker2 from "@/assets/sprites/cohesive/grain-handwerker-2.webp";
import grainHandwerker2Light from "@/assets/sprites/cohesive/night/grain-handwerker-2.webp";
import grainHandwerker3 from "@/assets/sprites/cohesive/grain-handwerker-3.webp";
import grainHandwerker3Light from "@/assets/sprites/cohesive/night/grain-handwerker-3.webp";
import grainPatrician2 from "@/assets/sprites/cohesive/grain-patrician-2.webp";
import grainPatrician2Light from "@/assets/sprites/cohesive/night/grain-patrician-2.webp";
import grainPatrician3 from "@/assets/sprites/cohesive/grain-patrician-3.webp";
import grainPatrician3Light from "@/assets/sprites/cohesive/night/grain-patrician-3.webp";
import workshopHandwerker2 from "@/assets/sprites/cohesive/workshop-handwerker-2.webp";
import workshopHandwerker2Light from "@/assets/sprites/cohesive/night/workshop-handwerker-2.webp";
import workshopHandwerker3 from "@/assets/sprites/cohesive/workshop-handwerker-3.webp";
import workshopHandwerker3Light from "@/assets/sprites/cohesive/night/workshop-handwerker-3.webp";
import workshopPatrician2 from "@/assets/sprites/cohesive/workshop-patrician-2.webp";
import workshopPatrician2Light from "@/assets/sprites/cohesive/night/workshop-patrician-2.webp";
import workshopPatrician3 from "@/assets/sprites/cohesive/workshop-patrician-3.webp";
import workshopPatrician3Light from "@/assets/sprites/cohesive/night/workshop-patrician-3.webp";
import gatewayHandwerker2 from "@/assets/sprites/cohesive/gateway-handwerker-2.webp";
import gatewayHandwerker2Light from "@/assets/sprites/cohesive/night/gateway-handwerker-2.webp";
import gatewayHandwerker3 from "@/assets/sprites/cohesive/gateway-handwerker-3.webp";
import gatewayHandwerker3Light from "@/assets/sprites/cohesive/night/gateway-handwerker-3.webp";
import gatewayPatrician2 from "@/assets/sprites/cohesive/gateway-patrician-2.webp";
import gatewayPatrician2Light from "@/assets/sprites/cohesive/night/gateway-patrician-2.webp";
import gatewayPatrician3 from "@/assets/sprites/cohesive/gateway-patrician-3.webp";
import gatewayPatrician3Light from "@/assets/sprites/cohesive/night/gateway-patrician-3.webp";

const nightUrls: Partial<Record<Kind, string>> = { badestube: badestubeLight, bakery: bakeryLight, barn: barnLight, chapel: chapelLight, church: churchLight, cottage: cottageLight, dairy: dairyLight, factory: factoryLight, farmhouse: farmhouseLight, fishery: fisheryLight, lodge: lodgeLight, herbhut: herbhutLight, woodcamp: woodcampLight, granary: granaryLight, guildhall: guildhallLight, harbor: harborLight, hut: hutLight, infirmary: infirmaryLight, firehouse: firehouseLight, guardhouse: guardhouseLight, inn: innLight, library: libraryLight, manufactory: manufactoryLight, markethall: markethallLight, mill: millLight, sawmill: sawmillLight, school: schoolLight, belfry: belfryLight, theater: theaterLight, opera: operaLight, university: universityLight, exchange: exchangeLight, orangery: orangeryLight, harvesthall: harvesthallLight, guildtower: guildtowerLight, lighthouse: lighthouseLight, smithy: smithyLight, station: stationLight, steamworks: steamworksLight, suburb: patricianLight, townhall: townhallLight, seat1: seat1Light, seat2: seat2Light, seat3: seat3Light, townhouse: townhouseLight, townhouse2: townhouse2Light, fachwerk: fachwerkLight, steinhaus: steinhausLight, handwerker: handwerkerLight, patrician: patricianLight, villa: villaLight, tenement: tenementLight, gatehouse: gatehouseLight, warehouse: warehouseLight, watermill: watermillLight, workshop: workshopLight, bigstore: bigstoreLight, millrow: millrowLight, stonemason: stonemasonLight, hammerworks: hammerworksLight, smokehouse: smokehouseLight, saltquay: saltquayLight, backhaus: backhausLight, herberge: herbergeLight, beginenhof: beginenhofLight };
const nightImages: Partial<Record<Kind, HTMLImageElement>> = {};
export const hasNightSprite = (kind: Kind) => Boolean(nightUrls[kind]);

type Sprite = { url: string; crop: [number, number, number, number]; width: number; base: number; image?: HTMLImageElement };
// Alpha bounds remove unequal transparent margins. Width is in world pixels, not screen pixels.
const sprites: Partial<Record<Kind, Sprite>> = {
  campfire: { url: campfire, crop: [0, 0, 480, 346], width: 7, base: 2.4 },
  hut: { url: hut, crop: [0, 0, 480, 392], width: 17, base: 4.6 },
  coop: { url: coop, crop: [0, 0, 480, 450], width: 10, base: 4 },
  fence: { url: fence, crop: [0, 0, 480, 253], width: 11, base: 3 },
  chapel: { url: chapel, crop: [0, 0, 474, 480], width: 21, base: 4 },
  watermill: { url: watermill, crop: [0, 0, 480, 478], width: 28, base: 4 },
  harbor: { url: harbor, crop: [0, 0, 480, 427], width: 26, base: 4 },
  stall: { url: stall, crop: [0, 0, 480, 480], width: 10, base: 4 },
  townhall: { url: townhall, crop: [0, 0, 423, 480], width: 31, base: 4 },
  seat1: { url: seat1, crop: [0, 0, 480, 439], width: 22, base: 4 },
  seat2: { url: seat2, crop: [0, 0, 480, 446], width: 26, base: 4 },
  seat3: { url: seat3, crop: [0, 0, 372, 480], width: 26, base: 4 },
  manufactory: { url: manufactory, crop: [0, 0, 480, 480], width: 31, base: 4 },
  steamworks: { url: steamworks, crop: [0, 0, 480, 480], width: 27, base: 4 },
  station: { url: station, crop: [0, 0, 416, 480], width: 27, base: 4 },
  suburb: { url: patrician, crop: [0, 0, 340, 480], width: 20, base: 4 },
  farmhouse: { url: farmhouse, crop: [0, 0, 480, 326], width: 22, base: 6.5 },
  cottage: { url: cottage, crop: [0, 0, 480, 385], width: 21.5, base: 4.4 },
  barn: { url: barn, crop: [0, 0, 475, 480], width: 15, base: 5 },
  church: { url: church, crop: [0, 0, 428, 480], width: 32, base: 5 },
  mill: { url: mill, crop: [0, 0, 477, 779], width: 16, base: 4 },
  inn: { url: inn, crop: [0, 0, 480, 427], width: 26, base: 5 },
  bakery: { url: bakery, crop: [0, 0, 480, 422], width: 23, base: 5 },
  townhouse: { url: townhouse, crop: [0, 0, 252, 480], width: 17, base: 4 },
  townhouse2: { url: townhouse2, crop: [0, 0, 291, 480], width: 17, base: 4 },
  fachwerk: { url: fachwerk, crop: [0, 0, 480, 413], width: 23, base: 4 },
  steinhaus: { url: steinhaus, crop: [0, 0, 334, 480], width: 19, base: 4 },
  handwerker: { url: handwerker, crop: [0, 0, 480, 445], width: 21, base: 4 },
  patrician: { url: patrician, crop: [0, 0, 340, 480], width: 23, base: 4 },
  villa: { url: villa, crop: [0, 0, 480, 406], width: 26, base: 4 },
  tenement: { url: tenement, crop: [0, 0, 480, 461], width: 26, base: 4 },
  workshop: { url: workshop, crop: [0, 0, 480, 433], width: 23, base: 5 },
  smithy: { url: smithy, crop: [0, 0, 480, 379], width: 23, base: 5 },
  warehouse: { url: warehouse, crop: [0, 0, 480, 343], width: 29, base: 5 },
  factory: { url: factory, crop: [0, 0, 480, 474], width: 62, base: 4 },
  sawmill: { url: sawmill, crop: [0, 0, 480, 382], width: 28, base: 5 },
  well: { url: well, crop: [0, 0, 349, 480], width: 6, base: 3.8 },
  market: { url: market, crop: [0, 0, 990, 665], width: 26, base: 5 },
  hay: { url: hay, crop: [0, 0, 966, 827], width: 13, base: 3 },
  fishery: { url: fishery, crop: [0, 0, 480, 391], width: 22, base: 4 },
  lodge: { url: lodge, crop: [0, 0, 480, 400], width: 21, base: 4 },
  backhaus: { url: backhausImg, crop: [0, 0, 480, 389], width: 18, base: 4 },
  herberge: { url: herbergeImg, crop: [0, 0, 470, 480], width: 22, base: 4 },
  beginenhof: { url: beginenhofImg, crop: [0, 0, 480, 374], width: 64, base: 4 },
  badestube: { url: badestubeImg, crop: [0, 0, 480, 376], width: 22, base: 4 },
  bigstore: { url: bigstoreImg, crop: [0, 0, 459, 480], width: 24, base: 4 },
  millrow: { url: millrowImg, crop: [0, 0, 480, 377], width: 27, base: 4 },
  stonemason: { url: stonemasonImg, crop: [0, 0, 480, 456], width: 24, base: 4 },
  hammerworks: { url: hammerworksImg, crop: [0, 0, 414, 480], width: 23, base: 4 },
  smokehouse: { url: smokehouseImg, crop: [0, 0, 480, 418], width: 25, base: 4 },
  saltquay: { url: saltquayImg, crop: [0, 0, 472, 480], width: 26, base: 4 },
  herbhut: { url: herbhut, crop: [0, 0, 480, 463], width: 19, base: 4 },
  woodcamp: { url: woodcamp, crop: [0, 0, 480, 427], width: 24, base: 4 },
  granary: { url: granary, crop: [0, 0, 408, 480], width: 25, base: 4 },
  infirmary: { url: infirmary, crop: [0, 0, 442, 480], width: 25, base: 4 },
  firehouse: { url: firehouse, crop: [0, 0, 446, 480], width: 22, base: 4 },
  guardhouse: { url: guardhouse, crop: [0, 0, 429, 480], width: 21, base: 4 },
  school: { url: school, crop: [0, 0, 474, 480], width: 25, base: 4 },
  belfry: { url: belfry, crop: [0, 0, 195, 480], width: 13, base: 3 },
  theater: { url: theater, crop: [0, 0, 466, 480], width: 31, base: 4 },
  opera: { url: opera, crop: [0, 0, 463, 480], width: 35, base: 4 },
  university: { url: university, crop: [0, 0, 480, 454], width: 66, base: 4 },
  exchange: { url: exchange, crop: [0, 0, 472, 480], width: 33, base: 4 },
  orangery: { url: orangery, crop: [0, 0, 480, 468], width: 60, base: 4 },
  harvesthall: { url: harvesthall, crop: [0, 0, 480, 419], width: 28, base: 4 },
  guildtower: { url: guildtower, crop: [0, 0, 293, 480], width: 17, base: 3 },
  lighthouse: { url: lighthouse, crop: [0, 0, 352, 480], width: 20, base: 4 },
  gatehouse: { url: gatehouse, crop: [0, 0, 295, 480], width: 24, base: 4 },
  markethall: { url: markethall, crop: [0, 0, 480, 429], width: 30, base: 4 },
  guildhall: { url: guildhall, crop: [0, 0, 339, 480], width: 21, base: 4 },
  library: { url: library, crop: [0, 0, 429, 480], width: 26, base: 4 },
  dairy: { url: dairy, crop: [0, 0, 480, 391], width: 24, base: 4 },
};

const spriteOf = (kind: Kind, _style?: HouseStyle) => sprites[kind];
const draftStyle = (_kind: Kind, style: HouseStyle | undefined, _variant: number) => style;

/** Town-character house styles (stone hill towns, brick harbour towns); same width, base and night framing as the base kind,
 * purely visual: households, taxes and rank use the base kind. Plains (grain) keep the classic art. */
export type HouseStyle = "workshop" | "gateway";
type StyleSlot = "cottage" | "fachwerk" | "patrician" | "hut" | "handwerker" | "farmhouse" | "barn" | "steinhaus" | "villa";
const STYLE_OF: Partial<Record<Kind, StyleSlot>> = { cottage: "cottage", fachwerk: "fachwerk", steinhaus: "steinhaus", villa: "villa", patrician: "patrician", hut: "hut", handwerker: "handwerker", farmhouse: "farmhouse", barn: "barn" };
type Styled = { day: string; night: string; crop: [number, number, number, number]; /** painted with its door on the opposite facade: mirrored so it faces the road like its siblings */ mirror?: boolean; image?: HTMLImageElement; light?: HTMLImageElement };
const styled: Record<HouseStyle, Record<StyleSlot, Styled>> = {
  workshop: { cottage: { day: cottageHill, night: cottageHillLight, crop: [0, 0, 480, 419] }, fachwerk: { day: fachwerkHill, night: fachwerkHillLight, crop: [0, 0, 344, 480] }, patrician: { day: patricianHill, night: patricianHillLight, crop: [0, 0, 272, 480] },
    hut: { day: hutHill, night: hutHillLight, crop: [0, 0, 453, 480] }, handwerker: { day: craftHill, night: craftHillLight, crop: [0, 0, 444, 480] }, farmhouse: { day: farmHill, night: farmHillLight, crop: [0, 0, 480, 369] }, barn: { day: barnHill, night: barnHillLight, crop: [0, 0, 480, 440] },
    steinhaus: { day: steinHill, night: steinHillLight, crop: [0, 0, 343, 480] }, villa: { day: villaHill, night: villaHillLight, crop: [0, 0, 480, 406] } },
  gateway: { cottage: { day: cottageCoast, night: cottageCoastLight, crop: [0, 0, 480, 419] }, fachwerk: { day: fachwerkCoast, night: fachwerkCoastLight, crop: [0, 0, 339, 480] }, patrician: { day: patricianCoast, night: patricianCoastLight, crop: [0, 0, 271, 480] },
    hut: { day: hutCoast, night: hutCoastLight, crop: [0, 0, 448, 480] }, handwerker: { day: craftCoast, night: craftCoastLight, crop: [0, 0, 285, 480] }, farmhouse: { day: farmCoast, night: farmCoastLight, crop: [0, 0, 480, 331] }, barn: { day: barnCoast, night: barnCoastLight, crop: [0, 0, 480, 334] },
    steinhaus: { day: steinCoast, night: steinCoastLight, crop: [0, 0, 338, 480] }, villa: { day: villaCoast, night: villaCoastLight, crop: [0, 0, 480, 410] } },
};
const styledBase = (kind: Kind, style?: HouseStyle) => { const k = style ? STYLE_OF[kind] : undefined; return k && style ? styled[style][k] : undefined; };
/** Alternative paintings of the commonest homes, per building style ("grain" = classic plains art). Slot 0 is always the
 * existing art; listed entries fill slots 1 and 2. Same width/base as the base kind, purely visual — households use the kind. */
export const VARIANT_KINDS = ["farmhouse", "cottage", "handwerker", "patrician"] as const;
export const VARIANT_COUNT = 3;
type VariantKind = (typeof VARIANT_KINDS)[number];
const variants: Record<VariantKind, Record<"grain" | HouseStyle, Styled[]>> = {
  farmhouse: { grain: [{ day: grainFarmhouse2, night: grainFarmhouse2Light, crop: [0, 0, 480, 348] }, { day: grainFarmhouse3, night: grainFarmhouse3Light, crop: [0, 0, 468, 480] }], workshop: [{ day: workshopFarmhouse2, night: workshopFarmhouse2Light, crop: [0, 0, 480, 428] }, { day: workshopFarmhouse3, night: workshopFarmhouse3Light, crop: [0, 0, 480, 323] }], gateway: [{ day: gatewayFarmhouse2, night: gatewayFarmhouse2Light, crop: [0, 0, 480, 341] }, { day: gatewayFarmhouse3, night: gatewayFarmhouse3Light, crop: [0, 0, 480, 367] }] },
  cottage: { grain: [{ day: grainCottage2, night: grainCottage2Light, crop: [0, 0, 480, 356] }, { day: grainCottage3, night: grainCottage3Light, crop: [0, 0, 480, 397] }], workshop: [{ day: workshopCottage2, night: workshopCottage2Light, crop: [0, 0, 480, 454] }, { day: workshopCottage3, night: workshopCottage3Light, crop: [0, 0, 480, 431] }], gateway: [{ day: gatewayCottage2, night: gatewayCottage2Light, crop: [0, 0, 480, 401] }, { day: gatewayCottage3, night: gatewayCottage3Light, crop: [0, 0, 480, 395], mirror: true }] },
  handwerker: { grain: [{ day: grainHandwerker2, night: grainHandwerker2Light, crop: [0, 0, 480, 410] }, { day: grainHandwerker3, night: grainHandwerker3Light, crop: [0, 0, 480, 441] }], workshop: [{ day: workshopHandwerker2, night: workshopHandwerker2Light, crop: [0, 0, 480, 470] }, { day: workshopHandwerker3, night: workshopHandwerker3Light, crop: [0, 0, 444, 480] }], gateway: [{ day: gatewayHandwerker2, night: gatewayHandwerker2Light, crop: [0, 0, 291, 480] }, { day: gatewayHandwerker3, night: gatewayHandwerker3Light, crop: [0, 0, 288, 480] }] },
  patrician: { grain: [{ day: grainPatrician2, night: grainPatrician2Light, crop: [0, 0, 346, 480] }, { day: grainPatrician3, night: grainPatrician3Light, crop: [0, 0, 344, 480] }], workshop: [{ day: workshopPatrician2, night: workshopPatrician2Light, crop: [0, 0, 275, 480] }, { day: workshopPatrician3, night: workshopPatrician3Light, crop: [0, 0, 269, 480] }], gateway: [{ day: gatewayPatrician2, night: gatewayPatrician2Light, crop: [0, 0, 264, 480] }, { day: gatewayPatrician3, night: gatewayPatrician3Light, crop: [0, 0, 271, 480] }] },
};
/** Which of the VARIANT_COUNT paintings a tile shows (0 = original art); `variant` is the tile's stable hash. */
export const variantSlot = (variant: number) => Math.min(VARIANT_COUNT - 1, Math.floor(variant * 997) % VARIANT_COUNT);
const styledOf = (kind: Kind, style?: HouseStyle, variant?: number) => {
  const vs = (variants as Partial<Record<Kind, Record<string, Styled[]>>>)[kind]?.[style ?? "grain"];
  const slot = variant === undefined ? 0 : variantSlot(variant);
  return (slot > 0 ? vs?.[slot - 1] : undefined) ?? styledBase(kind, style);
};
export const variantPaintingCount = (kind: VariantKind, style: "grain" | HouseStyle) => 1 + variants[kind][style].length;
const load = (url: string) => { const im = new Image(); im.decoding = "async"; im.src = url; return im; };
const ready = (im?: HTMLImageElement) => !!(im?.complete && im.naturalWidth);

/** Image URL of a building, for previews in menus. */
export const spriteUrl = (kind: Kind) => sprites[kind]?.url;
/** Browser images are created only when the canvas draws, never during SSR. */
/** Drawn width/height and ground offset of a building sprite (null while unknown). */
const HOME_SIZE: ReadonlySet<string> = new Set(["hut", "farmhouse", "cottage", "townhouse", "townhouse2", "fachwerk", "steinhaus", "handwerker", "patrician", "villa", "tenement", "suburb"]);
/** Homes vary ±4 % in size (rows keep an even eaves line), other buildings ±3 %. */
/** Homes are drawn larger so doors and yards read true beside villagers (realistic scale). */
const HOME_GROW = 1.15;
const scaleOf = (kind: Kind, variant: number) => HOME_SIZE.has(kind) ? HOME_GROW * (0.96 + variant * 0.08) : 0.97 + variant * 0.06;
export function spriteBox(kind: Kind, variant: number, style?: HouseStyle): { w: number; h: number; base: number } | null {
  style = draftStyle(kind, style, variant);
  const sprite = spriteOf(kind, style); if (!sprite) return null;
  const [, , sw, sh] = styledOf(kind, style, variant)?.crop ?? sprite.crop, w = sprite.width * scaleOf(kind, variant);
  return { w, h: w * sh / sw, base: sprite.base };
}
/** Paintings that already carry painted ground (yard, paving, garden, stacks) — every other building gets a soft contact
 * shadow derived from its own silhouette, so hard-cut plinths never float. Keys: kind, `<style>-<kind>`, `<style>-<kind>-<slot>`. */
const GROUNDED = new Set(["campfire", "coop", "fence", "chapel", "barn", "villa", "tenement", "sawmill", "beginenhof", "orangery", "stonemason", "saltquay", "herbhut", "woodcamp",
  "infirmary", "firehouse", "guardhouse", "school", "university", "exchange", "lighthouse", "hay", "well", "market", "steinhaus",
  "workshop-cottage", "workshop-farmhouse", "workshop-villa", "workshop-steinhaus",
  "gateway-cottage", "gateway-villa", "gateway-steinhaus", "gateway-farmhouse-3"]);
const paintingKey = (kind: Kind, style: HouseStyle | undefined, variant: number) => {
  const slot = (variants as Partial<Record<Kind, unknown>>)[kind] ? variantSlot(variant) : 0;
  if (slot > 0) return `${style ?? "grain"}-${kind}-${slot + 1}`;
  return style && STYLE_OF[kind] ? `${style}-${kind}` : kind;
};
export const needsGroundShadow = (kind: Kind, style: HouseStyle | undefined, variant: number) => (style = draftStyle(kind, style, variant), true) && !GROUNDED.has(paintingKey(kind, style, variant));
const shadows = new WeakMap<HTMLImageElement, HTMLCanvasElement | null>();
/** Blurred dark copy of the painting's lowest band (its footing), cached per image. */
function shadowOf(im: HTMLImageElement): HTMLCanvasElement | null {
  if (shadows.has(im)) return shadows.get(im)!;
  let cv: HTMLCanvasElement | null = null;
  if (typeof document !== "undefined") {
    const W = im.naturalWidth, H = im.naturalHeight, pad = 24, band = Math.round(H * 0.3);
    cv = document.createElement("canvas"); cv.width = W + pad * 2; cv.height = band + pad * 2;
    const g = cv.getContext("2d");
    if (g) {
      const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = band; const t = tmp.getContext("2d")!;
      t.drawImage(im, 0, H - band, W, band, 0, 0, W, band);
      t.globalCompositeOperation = "source-in"; t.fillStyle = "rgb(28,24,14)"; t.fillRect(0, 0, W, band);
      // fade upwards: only the footing casts the shadow
      t.globalCompositeOperation = "destination-in"; const fade = t.createLinearGradient(0, 0, 0, band); fade.addColorStop(0, "rgba(0,0,0,0)"); fade.addColorStop(1, "rgba(0,0,0,1)"); t.fillStyle = fade; t.fillRect(0, 0, W, band);
      g.filter = "blur(9px)"; g.drawImage(tmp, pad, pad); g.filter = "blur(4px)"; g.drawImage(tmp, pad, pad);
    } else cv = null;
  }
  shadows.set(im, cv); return cv;
}
function drawGroundShadow(c: CanvasRenderingContext2D, im: HTMLImageElement, left: number, top: number, width: number, height: number) {
  const sh = shadowOf(im); if (!sh) return;
  const k = width / im.naturalWidth, band = height * 0.3, a = c.globalAlpha;
  c.globalAlpha = a * 0.55;
  c.drawImage(sh, left - 24 * k + width * 0.012, top + height - band - 24 * k + height * 0.012, sh.width * k, sh.height * k);
  c.globalAlpha = a;
}
/** `reveal` < 1 draws only the lower part of the building (walls rising on a construction site). */
export function drawBuildingSprite(c: CanvasRenderingContext2D, kind: Kind, x: number, y: number, variant: number, reveal = 1, flip = false, style?: HouseStyle): boolean {
  style = draftStyle(kind, style, variant);
  const sprite = spriteOf(kind, style);
  if (!sprite || typeof Image === "undefined") return false;
  if (!sprite.image) {
    sprite.image = new Image();
    sprite.image.decoding = "async";
    sprite.image.src = sprite.url;
  }
  const st = styledOf(kind, style, variant);
  if (st && !st.image) st.image = load(st.day);
  const image = st && ready(st.image) && st.image ? st.image : sprite.image;
  if (image === st?.image && st.mirror) flip = !flip;
  if (!image.complete || !image.naturalWidth) return true; // still loading: draw nothing, never the old vector art
  const [, , sw, sh] = image === st?.image ? st.crop : sprite.crop;
  const width = sprite.width * scaleOf(kind, variant);
  const height = width * sh / sw;
  // fast path (most houses): unmirrored, finished, no moving parts — one drawImage, no save()/restore()
  if (reveal >= 1 && !flip && kind !== "mill" && kind !== "watermill" && kind !== "campfire") {
    if (!c.imageSmoothingEnabled) c.imageSmoothingEnabled = true;
    if (c.globalCompositeOperation === "source-over" && needsGroundShadow(kind, style, variant)) drawGroundShadow(c, image, x - width / 2, y + sprite.base - height, width, height);
    c.drawImage(seasonalImage(image), x - width / 2, y + sprite.base - height, width, height);
    return true;
  }
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  if (reveal < 1) { const top = y + sprite.base - height * reveal; c.beginPath(); c.rect(x - width, top, width * 2, height * 2); c.clip(); }
  const left = x - width / 2, top = y + sprite.base - height;
  if (flip) { c.translate(x * 2, 0); c.scale(-1, 1); }
  if (reveal >= 1 && c.globalCompositeOperation === "source-over" && needsGroundShadow(kind, style, variant)) drawGroundShadow(c, image, left, top, width, height);
  c.drawImage(seasonalImage(image), left, top, width, height);
  // moving parts are drawn inside the same (possibly mirrored) frame, so mirrored mills keep turning
  if (reveal >= 1) animate(c, kind, left, top, width / sw, x * 7 + y * 13);
  c.restore();
  return true;
}

/** The light-only layer uses exactly the daylight sprite's framing, scale and mirroring. */
export function drawBuildingNight(c: CanvasRenderingContext2D, kind: Kind, x: number, y: number, variant: number, intensity: number, flip = false, style?: HouseStyle) {
  style = draftStyle(kind, style, variant);
  const st = styledOf(kind, style, variant);
  if (st && !st.light) st.light = load(st.night);
  const own = !!st && ready(st.image) && ready(st.light);
  if (st && !own) return; // never pair a variant's walls with another painting's windows
  const image = own ? st?.light : nightImages[kind], box = spriteBox(kind, variant, own ? style : undefined);
  if (!image?.complete || !image.naturalWidth || !box) return;
  if (own && st?.mirror) flip = !flip;
  c.save();
  c.globalAlpha *= intensity;
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  if (flip) { c.translate(x * 2, 0); c.scale(-1, 1); }
  c.drawImage(image, x - box.w / 2, y + box.base - box.h, box.w, box.h);
  c.restore();
}

/** Starts loading every building image right away so towns appear complete. */
export function preloadBuildingSprites() {
  if (typeof Image === "undefined") return;
  for (const [kind, url] of Object.entries(nightUrls)) {
    const k = kind as Kind;
    if (!nightImages[k]) { const im = new Image(); im.decoding = "async"; im.src = url; nightImages[k] = im; }
  }
  for (const set of Object.values(styled)) for (const v of Object.values(set)) { v.image ??= load(v.day); v.light ??= load(v.night); }
  for (const sets of Object.values(variants)) for (const entries of Object.values(sets)) for (const v of entries) { v.image ??= load(v.day); v.light ??= load(v.night); }
  for (const s of Object.values(sprites)) if (s && !s.image) { s.image = new Image(); s.image.decoding = "async"; s.image.src = s.url; }
}
if (typeof window !== "undefined") preloadBuildingSprites();

// ---- living overlays: moving parts painted over the still sprites (pure functions of clock time) ----
let animT = 0;
/** Set once per frame by the renderer so every overlay shares the same clock. */
export function setSpriteTime(t: number) { animT = t; }
let sailsImg: HTMLImageElement | undefined;
if (typeof Image !== "undefined") { sailsImg = new Image(); sailsImg.decoding = "async"; sailsImg.src = millSails; }
let wheelImg: HTMLImageElement | undefined;
if (typeof Image !== "undefined") { wheelImg = new Image(); wheelImg.decoding = "async"; wheelImg.src = waterWheelUrl; }

function animate(c: CanvasRenderingContext2D, kind: Kind, left: number, top: number, k: number, sd: number) {
  const t = animT, P = (u: number, v: number): [number, number] => [left + u * k, top + v * k];
  if (kind === "mill") millSailsAt(c, ...P(33, 149), 480 * k * 1.45, t, sd);
  else if (kind === "watermill") waterWheel(c, ...P(370, 304), 72 * k, t, sd);
  else if (kind === "campfire") flames(c, ...P(168, 200), 150 * k, t, sd);
}

function millSailsAt(c: CanvasRenderingContext2D, x: number, y: number, d: number, t: number, sd: number) {
  if (!sailsImg?.complete || !sailsImg.naturalWidth) return;
  // integrated angle: steady ~19 s per turn with gentle gusts (multiplying t by a gust factor made it spin wildly)
  const a = t / 3000 - (0.25 * 9000 / 3000) * Math.cos(t / 9000 + sd) + sd;
  c.save(); c.translate(x, y);
  c.transform(0.62, 0.31, 0, 1, 0, 0); // sails parallel to the gable face (2:1 ground axis)
  c.rotate(a);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
  c.drawImage(sailsImg, -d / 2, -d / 2, d, d);
  c.restore();
}

function waterWheel(c: CanvasRenderingContext2D, x: number, y: number, r: number, t: number, sd: number) {
  const a = t / 1800 + sd;
  // the building sprite has an empty wheel pit with shaft; this is the only wheel. Its plane runs parallel to the
  // pit wall (the +26.6° ground axis). Overshot: water drops on the top far side, so the wheel turns clockwise on screen.
  c.save(); c.translate(x, y); c.transform(0.58, -0.29, 0, 1, 0, 0);
  if (wheelImg?.complete && wheelImg.naturalWidth) {
    c.rotate(a); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
    c.drawImage(seasonalImage(wheelImg), -r * 1.05, -r * 1.05, r * 2.1, r * 2.1);
  }
  c.restore();
  // water spilling over the paddles and splashing below
  for (let i = 0; i < 9; i++) {
    const ph = (t / 700 + i / 9 + sd * 0.1) % 1;
    const px = x + r * (0.55 + 0.15 * Math.sin(i * 2.3)), py = y - r * 0.9 + ph * r * 2;
    c.fillStyle = `rgba(215,232,238,${0.55 * (1 - ph)})`;
    c.fillRect(px, py, r * 0.035, r * 0.12);
  }
  for (let i = 0; i < 5; i++) {
    const ph = (t / 900 + i / 5) % 1;
    c.fillStyle = `rgba(230,240,240,${0.35 * (1 - ph)})`;
    c.beginPath(); c.ellipse(x + r * (0.2 + i * 0.12), y + r * 1.02, r * (0.06 + ph * 0.14), r * (0.025 + ph * 0.05), 0, 0, 7); c.fill();
  }
}

function flames(c: CanvasRenderingContext2D, x: number, y: number, h: number, t: number, sd: number) {
  c.save();
  // breathing glow on stones and ground
  const fl = 0.75 + 0.15 * Math.sin(t / 110 + sd) + 0.1 * Math.sin(t / 47 + sd * 3);
  const g = c.createRadialGradient(x, y - h * 0.1, 0, x, y - h * 0.1, h * 0.9);
  g.addColorStop(0, `rgba(255,170,70,${0.28 * fl})`); g.addColorStop(1, "rgba(255,140,50,0)");
  c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(x - h, y - h, h * 2, h * 2);
  // flickering tongues
  for (let i = 0; i < 6; i++) {
    const ph = t / (90 + i * 23) + i * 1.7 + sd;
    const hx = x + (i - 2.5) * h * 0.07, tall = h * (0.42 + 0.22 * Math.abs(Math.sin(ph)) + 0.08 * Math.sin(ph * 2.7));
    const sway = Math.sin(ph * 1.3) * h * 0.06, w = h * (0.1 + 0.03 * Math.sin(ph * 0.7));
    const fg = c.createLinearGradient(hx, y, hx, y - tall);
    fg.addColorStop(0, "rgba(255,120,30,0.55)"); fg.addColorStop(0.5, "rgba(255,190,70,0.4)"); fg.addColorStop(1, "rgba(255,230,140,0)");
    c.fillStyle = fg; c.beginPath();
    c.moveTo(hx - w, y);
    c.quadraticCurveTo(hx - w * 0.9, y - tall * 0.5, hx + sway, y - tall);
    c.quadraticCurveTo(hx + w * 0.9, y - tall * 0.5, hx + w, y);
    c.closePath(); c.fill();
  }
  // sparks rising and drifting
  for (let i = 0; i < 7; i++) {
    const ph = (t / 1400 + i / 7 + (sd % 1)) % 1;
    const sx = x + Math.sin(i * 4.1 + ph * 6) * h * 0.18 + ph * h * 0.12, sy = y - h * 0.3 - ph * h * 0.9;
    c.fillStyle = `rgba(255,${200 - ph * 80},90,${0.9 * (1 - ph)})`;
    c.fillRect(sx, sy, h * 0.012, h * 0.012);
  }
  c.restore();
}
