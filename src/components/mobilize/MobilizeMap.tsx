"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { GeoJSONSource, MapLayerMouseEvent } from "mapbox-gl";
import { useCallback, useMemo, useState } from "react";
import MapGL, { GeolocateControl, Layer, NavigationControl, Popup, Source } from "react-map-gl/mapbox";

/**
 * Mobilize map uses the same stack documented by Horizon UI Map:
 * `react-map-gl` + Mapbox GL (`mapbox-gl`). The rest of the dashboard uses MUI for layout
 * (Horizon UI is Chakra-based); Mapbox integration follows Horizon’s documented imports.
 *
 * @see https://horizon-ui.com/documentation/docs/components/map
 */
export type MobilizeMapMarker = {
  id: string;
  name: string;
  group_type: string;
  description?: string | null;
  address_line?: string | null;
  latitude: number;
  longitude: number;
};

type Props = {
  markers: MobilizeMapMarker[];
  mapboxToken: string;
  onJoinClick?: (groupId: string) => void;
  onViewDetails?: (groupId: string) => void;
};

const defaultView = {
  latitude: 39.8283,
  longitude: -98.5795,
  zoom: 3,
};

export function MobilizeMap({ markers, mapboxToken, onJoinClick, onViewDetails }: Props) {
  const [popupGroupId, setPopupGroupId] = useState<string | null>(null);

  const geojson = useMemo(
    () =>
      ({
        type: "FeatureCollection" as const,
        features: markers
          .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
          .map((m) => ({
            type: "Feature" as const,
            properties: {
              groupId: m.id,
              name: m.name,
              group_type: m.group_type,
              address: m.address_line ?? "",
            },
            geometry: {
              type: "Point" as const,
              coordinates: [m.longitude, m.latitude],
            },
          })),
      }) as const,
    [markers]
  );

  const markerById = useMemo(() => new globalThis.Map(markers.map((m) => [m.id, m])), [markers]);
  const popupMarker = popupGroupId ? markerById.get(popupGroupId) : undefined;

  const onMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) {
        setPopupGroupId(null);
        return;
      }
      const map = event.target;
      if (feature.layer?.id === "clusters") {
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("mobilize-groups") as GeoJSONSource | undefined;
        if (clusterId == null || !source || typeof source.getClusterExpansionZoom !== "function") {
          return;
        }
        source.getClusterExpansionZoom(Number(clusterId), (err, zoom) => {
          if (err) return;
          const geom = feature.geometry as unknown as { type?: string; coordinates?: [number, number] };
          const coords = geom.type === "Point" && geom.coordinates ? geom.coordinates : null;
          if (!coords) return;
          map.easeTo({ center: coords, zoom: zoom ?? map.getZoom() + 2, duration: 500 });
        });
        return;
      }
      const gid = String(feature.properties?.groupId ?? "");
      if (gid) setPopupGroupId(gid);
    },
    [setPopupGroupId]
  );

  if (!mapboxToken) {
    return (
      <div
        style={{
          height: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 8,
          color: "#fff",
          padding: 24,
          textAlign: "center",
        }}
      >
        Set <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to enable the Mobilize map (Mapbox token
        required for <code>react-map-gl</code> / Mapbox GL, per Horizon UI Map documentation).
      </div>
    );
  }

  return (
    <MapGL
      mapboxAccessToken={mapboxToken}
      initialViewState={defaultView}
      style={{ width: "100%", height: "min(70vh, 640px)", borderRadius: 8 }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      interactiveLayerIds={["clusters", "unclustered-point"]}
      onClick={onMapClick}
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-left" trackUserLocation showUserHeading />

      <Source
        id="mobilize-groups"
        type="geojson"
        data={geojson}
        cluster
        clusterMaxZoom={14}
        clusterRadius={50}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd6",
              10,
              "#f1f075",
              30,
              "#f28cb1",
            ],
            "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 30, 30],
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
          }}
          paint={{ "text-color": "#0b0b0f" }}
        />
        <Layer
          id="unclustered-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": "#c32020",
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff",
          }}
        />
      </Source>

      {popupMarker ? (
        <Popup
          anchor="top"
          longitude={popupMarker.longitude}
          latitude={popupMarker.latitude}
          onClose={() => setPopupGroupId(null)}
          closeButton
        >
          <div style={{ minWidth: 200, color: "#111" }}>
            <strong>{popupMarker.name}</strong>
            <div style={{ fontSize: 12, marginTop: 4 }}>{popupMarker.group_type}</div>
            {popupMarker.address_line ? (
              <div style={{ fontSize: 12, marginTop: 6 }}>{popupMarker.address_line}</div>
            ) : null}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                style={{ flex: 1, padding: "6px 8px", cursor: "pointer" }}
                onClick={() => onJoinClick?.(popupMarker.id)}
              >
                Join
              </button>
              <button
                type="button"
                style={{ flex: 1, padding: "6px 8px", cursor: "pointer" }}
                onClick={() => onViewDetails?.(popupMarker.id)}
              >
                View details
              </button>
            </div>
          </div>
        </Popup>
      ) : null}
    </MapGL>
  );
}
