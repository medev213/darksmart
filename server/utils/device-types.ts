export function getDeviceTypeFromProductId(productId: string): string {
  const firstDigit = productId.charAt(0)
  const typeMap: Record<string, string> = {
    "1": "Smart Outlet",
    "2": "Smart Switch",
    "3": "Smart Sensor",
    "4": "Smart Plug Bridge",
    "5": "Smart Valve",
  }
  return typeMap[firstDigit] || "Unknown Device"
}

export function getGoogleDeviceType(deviceType: string): string {
  const googleTypeMap: Record<string, string> = {
    "Smart Outlet": "action.devices.types.OUTLET",
    "Smart Switch": "action.devices.types.SWITCH",
    "Smart Sensor": "action.devices.types.SENSOR",
    "Smart Plug Bridge": "action.devices.types.PLUG",
    "Smart Valve": "action.devices.types.VALVE",
  }
  return googleTypeMap[deviceType] || "action.devices.types.OUTLET"
}

export function getTraitsForDeviceType(deviceType: string): string[] {
  const traitsMap: Record<string, string[]> = {
    "Smart Outlet": ["action.devices.traits.OnOff"],
    "Smart Switch": ["action.devices.traits.OnOff"],
    "Smart Sensor": ["action.devices.traits.TemperatureSetting"],
    "Smart Plug Bridge": ["action.devices.traits.OnOff"],
    "Smart Valve": ["action.devices.traits.OnOff"],
  }
  return traitsMap[deviceType] || ["action.devices.traits.OnOff"]
}
