import { useDefineApi } from "@/stores/useDefineApi";
import type { ImageInfo, DockerNetworkModes, ContainerInfo } from "@/types";

export const imageList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      imageId?: string;
    };
    data?: {
      dockerFile: string;
      name: string;
      tag: string;
    };
    method: string;
  },
  ImageInfo[]
>({
  url: "/api/environment/image"
});

export const getNetworkModeList = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
  },
  DockerNetworkModes[]
>({
  url: "/api/environment/networkModes",
  method: "GET"
});

export const containerList = useDefineApi<
  {
    params: {
      remote_uuid: string;
      imageId?: string;
    };
  },
  ContainerInfo[]
>({
  url: "/api/environment/containers",
  method: "GET"
});

export const buildProgress = useDefineApi<
  {
    params: {
      remote_uuid: string;
    };
  },
  {
    [propsName: string]: number;
  }
>({
  url: "/api/environment/progress",
  method: "GET"
});
