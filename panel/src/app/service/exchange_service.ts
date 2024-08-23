import RemoteServiceSubsystem from "../service/remote_service";
import RemoteRequest from "../service/remote_command";
import user_service from "../service/user_service";
import { customAlphabet } from "nanoid";
import { t } from "i18next";
import { toNumber, toText } from "common";
import { AdvancedInstanceInfo, getInstancesByUuid } from "./instance_service";

// ------- Protocol Define -------
export interface DaemonStatusProtocol {
  name: string;
  id: string;
  ip: string;
  port: number;
  available: boolean;
  running: number;
  instances: number;
}

export interface InstanceInfoProtocol {
  instance_id: string;
  name: string;
  expire: number;
  status: number;
  lines: Array<{ title: string; value: any }>;
  ports: PortInfo[];
}

export interface BuyResponseProtocol {
  instance_id: string;
  instance_config: any;
  username: string;
  password: string;
  uuid: string;
  expire: number;
  instance_info?: InstanceInfoProtocol;
}

export enum RequestAction {
  BUY = "buy",
  RENEW = "renew",
  QUERY_INSTANCE = "query_instance",
  PING = "ping"
}

export interface PortInfo {
  host: number;
  container: number;
  protocol: string;
}

// ------- Define End ------

const getNanoId = customAlphabet(
  "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  6
);

function formatInstanceData(instance: AdvancedInstanceInfo): InstanceInfoProtocol {
  let ports: string[] = instance.docker?.ports ?? [];
  let portRules: Array<PortInfo> = [];
  if (ports?.length > 0) {
    ports.forEach((line: string) => {
      // line = "23333:24444/tcp"
      const [ports, protocol] = line.split("/");
      if (!ports || !protocol) return;
      const [host, container] = ports.split(":");
      if (isNaN(Number(container)) || isNaN(Number(host))) return;
      portRules.push({
        protocol,
        container: Number(container),
        host: Number(host)
      });
    });
  }
  const lines = [];
  if (instance.info?.maxPlayers && Number(instance.info?.maxPlayers) != -1) {
    lines.push({
      title: t("TXT_CODE_7e9727bd"),
      value: `${instance.info?.currentPlayers}/${instance.info?.maxPlayers}`
    });
  }
  return {
    instance_id: instance.instanceUuid,
    name: instance.nickname || "",
    status: instance.status || 0,
    ports: portRules,
    expire: instance.endTime || 0,
    lines
  };
}

export function parseUserName(t?: string) {
  if (!t || typeof t !== "string") return "";
  if (t.startsWith("User-")) return t;
  return `User-${toText(t) ?? ""}`;
}

export async function buyOrRenewInstance(
  request_action: RequestAction,
  params: Record<string, any>
): Promise<BuyResponseProtocol> {
  const node_id = toText(params.node_id) ?? "";
  const instance_id = toText(params.instance_id) ?? "";
  const username = parseUserName(params.username);
  const hours = toNumber(params.hours) ?? 0;
  const payload = params.payload ?? {};

  const remoteService = RemoteServiceSubsystem.getInstance(node_id || "");
  if (!remoteService?.available) {
    throw new Error(t("TXT_CODE_bed32084"));
  }

  const remoteRequest = new RemoteRequest(remoteService);

  if (request_action === RequestAction.BUY) {
    payload.endTime = (payload.endTime ? payload.endTime : Date.now()) + hours * 3600 * 1000;
    payload.nickname = payload.nickname + "-" + getNanoId(6);
    const { instanceUuid: newInstanceId, config: newInstanceConfig } = await remoteRequest.request(
      "instance/new",
      payload
    );
    if (!newInstanceId) throw new Error(t("TXT_CODE_728fdabf"));

    let user = user_service.getUserByUserName(username);
    let newPassword = "";

    if (user) {
      await user_service.edit(user.uuid, {
        instances: [
          ...user.instances,
          {
            instanceUuid: newInstanceId,
            daemonId: node_id
          }
        ]
      });
    } else {
      newPassword = getNanoId(12);
      user = await user_service.create({
        userName: username,
        passWord: newPassword,
        permission: 1,
        instances: [
          {
            instanceUuid: newInstanceId,
            daemonId: node_id
          }
        ]
      });
    }
    return {
      instance_id: newInstanceId,
      instance_config: newInstanceConfig,
      username: user.userName,
      password: newPassword,
      uuid: user.uuid,
      expire: toNumber(newInstanceConfig.endTime) || 0,
      instance_info: formatInstanceData(newInstanceConfig)
    };
  }

  if (request_action === RequestAction.RENEW) {
    const instanceInfo = await remoteRequest.request("instance/detail", {
      instanceUuid: instance_id
    });
    if (!instanceInfo.config) throw new Error(t("TXT_CODE_348c9098"));
    instanceInfo.config.endTime =
      (instanceInfo.config?.endTime ? instanceInfo.config.endTime : Date.now()) +
      hours * 3600 * 1000;
    await remoteRequest.request("instance/update", {
      instanceUuid: instance_id,
      config: instanceInfo.config
    });
    return {
      instance_id,
      instance_config: instanceInfo.config,
      expire: toNumber(instanceInfo.config.endTime) || 0,
      username: "",
      password: "",
      uuid: ""
    };
  }

  throw new Error(t("TXT_CODE_4aaec75c"));
}

export async function queryInstanceByUserId(
  params: Record<string, any>
): Promise<InstanceInfoProtocol[]> {
  const name = parseUserName(params.username) || "";
  const user = user_service.getUserByUserName(name);
  if (!user) throw new Error(t("TXT_CODE_903b6c50"));

  const { instances = [] } = await getInstancesByUuid(user.uuid, true);
  const newInstancesInfo = instances.map((v) => {
    return formatInstanceData(v);
  });
  return newInstancesInfo;
}

export async function getNodeStatus(params: Record<string, any>): Promise<DaemonStatusProtocol> {
  const nodeId = toText(params.node_id) ?? "";
  const remoteService = RemoteServiceSubsystem.getInstance(nodeId);
  if (!remoteService?.available) {
    throw new Error(t("TXT_CODE_bed32084"));
  }
  const remoteRequest = new RemoteRequest(remoteService);
  const remoteInfo = await remoteRequest.request("info/overview");
  remoteInfo.uuid = remoteService.uuid;
  remoteInfo.ip = remoteService.config.ip;
  remoteInfo.port = remoteService.config.port;
  remoteInfo.prefix = remoteService.config.prefix;
  remoteInfo.available = remoteService.available;
  remoteInfo.remarks = remoteService.config.remarks;
  return {
    name: String(remoteInfo.remarks),
    id: String(remoteInfo.uuid),
    ip: String(remoteInfo.ip),
    port: Number(remoteInfo.port),
    available: Boolean(remoteInfo.available),
    running: Number(remoteInfo.instance.running),
    instances: Number(remoteInfo.instance.total)
  };
}