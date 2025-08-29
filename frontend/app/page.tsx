"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Plus, Power, Trash, Package, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/lib/theme-context"
import { ThemeToggle } from "@/components/theme-toggle"

const API_BASE_URL = "http://localhost:8000"

interface Service {
  name: string
  path?: string
  infra?: boolean
  image?: string
  ports?: string[]
  environment?: Record<string, string>
  volumes?: string[]
}

interface ServiceList {
  detected: Service[]
  managed: {
    managed: Service[]
    infra: Service[]
  }
}

const mockServices: ServiceList = {
  detected: [
    { name: "web-app", path: "./frontend" },
    { name: "api-service", path: "./backend" },
  ],
  managed: {
    managed: [
      { name: "user-service", path: "./services/users" },
      { name: "auth-service", path: "./services/auth" },
    ],
    infra: [
      { name: "postgres", infra: true },
      { name: "redis", infra: true },
    ],
  },
}

export default function App() {
  const { theme } = useTheme()
  const [services, setServices] = useState<ServiceList>(mockServices)
  const [serviceData, setServiceData] = useState({ name: "", path: "", infra: false })
  const [isLoading, setIsLoading] = useState(false)
  const [useMockData, setUseMockData] = useState(true)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/list`)
      if (response.ok) {
        const data = await response.json()
        setServices(data)
        setUseMockData(false)
        console.log("[v0] Connected to API server")
      } else {
        throw new Error("API not available")
      }
    } catch (error) {
      console.log("[v0] API server not available, using demo data")
      setUseMockData(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setServiceData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const addService = async () => {
    if (!serviceData.name.trim()) return

    setIsLoading(true)

    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const newService = { ...serviceData }
      if (serviceData.infra) {
        setServices((prev) => ({
          ...prev,
          managed: {
            ...prev.managed,
            infra: [...prev.managed.infra, newService],
          },
        }))
      } else {
        setServices((prev) => ({
          ...prev,
          managed: {
            ...prev.managed,
            managed: [...prev.managed.managed, newService],
          },
        }))
      }
      setServiceData({ name: "", path: "", infra: false })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        throw new Error("Failed to add service")
      }

      setServiceData({ name: "", path: "", infra: false })
      await fetchServices()
    } catch (error) {
      console.error("Error adding service:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteService = async (name: string) => {
    setIsLoading(true)

    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setServices((prev) => ({
        ...prev,
        managed: {
          managed: prev.managed.managed.filter((s) => s.name !== name),
          infra: prev.managed.infra.filter((s) => s.name !== name),
        },
      }))
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/services/${name}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Failed to delete service")
      }
      await fetchServices()
    } catch (error) {
      console.error("Error deleting service:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDockerAction = async (action: "up" | "down" | "generate") => {
    setIsLoading(true)

    if (useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log(`[v0] Mock Docker action '${action}' completed`)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${action}`, { method: "POST" })
      const data = await response.json()
      console.log(`Docker action '${action}' result:`, data)
    } catch (error) {
      console.error(`Failed to perform docker action '${action}':`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalServices = services.detected.length + services.managed.managed.length + services.managed.infra.length

  return (
    <div
      className={`
      min-h-screen transition-colors duration-200
      ${theme === "light" ? "bg-gray-50 text-slate-900" : ""}
      ${theme === "dark" ? "bg-slate-900 text-slate-100" : ""}
      ${theme === "terminal" ? "bg-black text-gray-400" : ""}
      font-sans
    `}
    >
      <div
        className={`
        border-b transition-colors duration-200
        ${theme === "light" ? "border-gray-200 bg-white" : ""}
        ${theme === "dark" ? "border-slate-700 bg-slate-800" : ""}
        ${theme === "terminal" ? "border-gray-800 bg-gray-900" : ""}
      `}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`
                text-xl
                ${theme === "light" ? "text-blue-600" : ""}
                ${theme === "dark" ? "text-blue-400" : ""}
                ${theme === "terminal" ? "text-gray-400" : ""}
              `}
              >
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1
                  className={`
                  text-xl font-bold tracking-wider
                  ${theme === "light" ? "text-slate-900" : ""}
                  ${theme === "dark" ? "text-slate-100" : ""}
                  ${theme === "terminal" ? "text-gray-400 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "DOCKER_COMPOSE_MGR" : "Docker Compose Manager"}
                </h1>
                <p
                  className={`
                  text-xs
                  ${theme === "light" ? "text-slate-500" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "// service orchestration terminal" : "Service orchestration dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {useMockData && (
                <span
                  className={`
                  text-xs px-2 py-1 rounded-md
                  ${theme === "light" ? "text-amber-700 bg-amber-100 border border-amber-200" : ""}
                  ${theme === "dark" ? "text-amber-400 bg-amber-900/20 border border-amber-800" : ""}
                  ${theme === "terminal" ? "text-yellow-400 bg-yellow-900/20 border border-yellow-800" : ""}
                `}
                >
                  {theme === "terminal" ? "[DEMO_MODE]" : "Demo Mode"}
                </span>
              )}
              <div
                className={`
                text-xs
                ${theme === "light" ? "text-slate-600" : ""}
                ${theme === "dark" ? "text-slate-400" : ""}
                ${theme === "terminal" ? "text-gray-600" : ""}
              `}
              >
                {theme === "terminal" ? "STATUS: " : "Status: "}
                <span
                  className={`
                  ${theme === "light" ? "text-green-600" : ""}
                  ${theme === "dark" ? "text-green-400" : ""}
                  ${theme === "terminal" ? "text-gray-400" : ""}
                `}
                >
                  {theme === "terminal" ? "ONLINE" : "Online"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {useMockData && (
        <div
          className={`
          border-b transition-colors duration-200
          ${theme === "light" ? "bg-amber-50 border-amber-200" : ""}
          ${theme === "dark" ? "bg-amber-900/10 border-amber-800" : ""}
          ${theme === "terminal" ? "bg-yellow-900/10 border-yellow-800" : ""}
        `}
        >
          <div className="container mx-auto px-6 py-2">
            <p
              className={`
              text-xs
              ${theme === "light" ? "text-amber-700" : ""}
              ${theme === "dark" ? "text-amber-400" : ""}
              ${theme === "terminal" ? "text-yellow-400" : ""}
            `}
            >
              {theme === "terminal"
                ? "> WARNING: API_SERVER_UNAVAILABLE | FALLBACK_TO_MOCK_DATA | CONNECT_BACKEND_AT_LOCALHOST:8000"
                : "⚠️ API server unavailable - using demo data. Connect your backend at localhost:8000"}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`
            p-6 rounded-xl transition-all duration-200 hover:shadow-lg
            ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
            ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
            ${theme === "terminal" ? "border border-gray-800 bg-gray-900/50" : ""}
          `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                p-2 rounded-lg
                ${theme === "light" ? "bg-blue-100 text-blue-600" : ""}
                ${theme === "dark" ? "bg-blue-900/30 text-blue-400" : ""}
                ${theme === "terminal" ? "text-gray-400" : ""}
              `}
              >
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`
                  text-xs font-medium uppercase tracking-wider
                  ${theme === "light" ? "text-slate-500" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "TOTAL_SERVICES" : "Total Services"}
                </p>
                <p
                  className={`
                  text-2xl font-bold
                  ${theme === "light" ? "text-slate-900" : ""}
                  ${theme === "dark" ? "text-slate-100" : ""}
                  ${theme === "terminal" ? "text-gray-400" : ""}
                `}
                >
                  {theme === "terminal" ? totalServices.toString().padStart(2, "0") : totalServices}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`
            p-6 rounded-xl transition-all duration-200 hover:shadow-lg
            ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
            ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
            ${theme === "terminal" ? "border border-gray-800 bg-gray-900/50" : ""}
          `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                p-2 rounded-lg
                ${theme === "light" ? "bg-amber-100 text-amber-600" : ""}
                ${theme === "dark" ? "bg-amber-900/30 text-amber-400" : ""}
                ${theme === "terminal" ? "text-yellow-400" : ""}
              `}
              >
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`
                  text-xs font-medium uppercase tracking-wider
                  ${theme === "light" ? "text-slate-500" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "DETECTED" : "Detected"}
                </p>
                <p
                  className={`
                  text-2xl font-bold
                  ${theme === "light" ? "text-amber-600" : ""}
                  ${theme === "dark" ? "text-amber-400" : ""}
                  ${theme === "terminal" ? "text-yellow-400" : ""}
                `}
                >
                  {theme === "terminal"
                    ? services.detected.length.toString().padStart(2, "0")
                    : services.detected.length}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`
            p-6 rounded-xl transition-all duration-200 hover:shadow-lg
            ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
            ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
            ${theme === "terminal" ? "border border-gray-800 bg-gray-900/50" : ""}
          `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                p-2 rounded-lg
                ${theme === "light" ? "bg-green-100 text-green-600" : ""}
                ${theme === "dark" ? "bg-green-900/30 text-green-400" : ""}
                ${theme === "terminal" ? "text-gray-400" : ""}
              `}
              >
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={`
                  text-xs font-medium uppercase tracking-wider
                  ${theme === "light" ? "text-slate-500" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "MANAGED" : "Managed"}
                </p>
                <p
                  className={`
                  text-2xl font-bold
                  ${theme === "light" ? "text-slate-900" : ""}
                  ${theme === "dark" ? "text-slate-100" : ""}
                  ${theme === "terminal" ? "text-gray-400" : ""}
                `}
                >
                  {theme === "terminal"
                    ? (services.managed.managed.length + services.managed.infra.length).toString().padStart(2, "0")
                    : services.managed.managed.length + services.managed.infra.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`
          rounded-xl transition-all duration-200
          ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
          ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
          ${theme === "terminal" ? "border border-gray-800 bg-gray-900/30" : ""}
        `}
        >
          <div
            className={`
            px-6 py-4 border-b rounded-t-xl
            ${theme === "light" ? "border-gray-200 bg-gray-50" : ""}
            ${theme === "dark" ? "border-slate-700 bg-slate-700/50" : ""}
            ${theme === "terminal" ? "border-gray-800 bg-gray-900/50" : ""}
          `}
          >
            <h3
              className={`
              text-sm font-bold uppercase tracking-wider flex items-center gap-2
              ${theme === "light" ? "text-slate-700" : ""}
              ${theme === "dark" ? "text-slate-300" : ""}
              ${theme === "terminal" ? "text-gray-400 font-mono" : ""}
            `}
            >
              <Plus className="w-4 h-4" />
              {theme === "terminal" ? "ADD_SERVICE" : "Add Service"}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label
                  className={`
                  block text-xs font-medium uppercase tracking-wider mb-2
                  ${theme === "light" ? "text-slate-600" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "SERVICE_NAME" : "Service Name"}
                </label>
                <Input
                  placeholder={theme === "terminal" ? "service-name" : "Enter service name"}
                  name="name"
                  value={serviceData.name}
                  onChange={handleInputChange}
                  className={`
                    transition-colors duration-200
                    ${theme === "light" ? "bg-gray-50 border-gray-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500" : ""}
                    ${theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400" : ""}
                    ${theme === "terminal" ? "bg-black border-gray-800 text-gray-400 placeholder-gray-700 focus:border-gray-400 font-mono" : ""}
                  `}
                />
              </div>

              {!serviceData.infra && (
                <div>
                  <label
                    className={`
                    block text-xs font-medium uppercase tracking-wider mb-2
                    ${theme === "light" ? "text-slate-600" : ""}
                    ${theme === "dark" ? "text-slate-400" : ""}
                    ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                  `}
                  >
                    {theme === "terminal" ? "PATH" : "Path"}
                  </label>
                  <Input
                    placeholder={theme === "terminal" ? "./service-path" : "Enter service path"}
                    name="path"
                    value={serviceData.path}
                    onChange={handleInputChange}
                    className={`
                      transition-colors duration-200
                      ${theme === "light" ? "bg-gray-50 border-gray-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500" : ""}
                      ${theme === "dark" ? "bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-400 focus:ring-blue-400" : ""}
                      ${theme === "terminal" ? "bg-black border-gray-800 text-gray-400 placeholder-gray-700 focus:border-gray-400 font-mono" : ""}
                    `}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="infra"
                  checked={serviceData.infra}
                  onCheckedChange={(checked) => setServiceData((prev) => ({ ...prev, infra: checked as boolean }))}
                  className={`
                    transition-colors duration-200
                    ${theme === "light" ? "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white" : ""}
                    ${theme === "dark" ? "border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white" : ""}
                    ${theme === "terminal" ? "border-gray-800 data-[state=checked]:bg-gray-400 data-[state=checked]:text-black" : ""}
                  `}
                />
                <Label
                  htmlFor="infra"
                  className={`
                  text-xs font-medium uppercase tracking-wider
                  ${theme === "light" ? "text-slate-600" : ""}
                  ${theme === "dark" ? "text-slate-400" : ""}
                  ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                `}
                >
                  {theme === "terminal" ? "INFRA" : "Infrastructure"}
                </Label>
              </div>

              <Button
                onClick={addService}
                disabled={!serviceData.name.trim() || isLoading}
                className={`
                  transition-all duration-200 font-medium uppercase tracking-wider
                  ${theme === "light" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md" : ""}
                  ${theme === "dark" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                  ${theme === "terminal" ? "bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-600 font-mono" : ""}
                `}
              >
                {isLoading
                  ? theme === "terminal"
                    ? "ADDING..."
                    : "Adding..."
                  : theme === "terminal"
                    ? "ADD"
                    : "Add Service"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className={`
            rounded-xl transition-all duration-200
            ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
            ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
            ${theme === "terminal" ? "border border-gray-800 bg-gray-900/30" : ""}
          `}
          >
            <div
              className={`
              px-6 py-4 border-b rounded-t-xl
              ${theme === "light" ? "border-gray-200 bg-amber-50" : ""}
              ${theme === "dark" ? "border-slate-700 bg-amber-900/20" : ""}
              ${theme === "terminal" ? "border-gray-800 bg-gray-900/50" : ""}
            `}
            >
              <h3
                className={`
                text-sm font-bold uppercase tracking-wider flex items-center gap-2
                ${theme === "light" ? "text-amber-700" : ""}
                ${theme === "dark" ? "text-amber-400" : ""}
                ${theme === "terminal" ? "text-yellow-400" : ""}
              `}
              >
                <AlertCircle className="w-4 h-4" />
                {theme === "terminal"
                  ? `DETECTED_SERVICES [${services.detected.length.toString().padStart(2, "0")}]`
                  : `Detected Services (${services.detected.length})`}
              </h3>
            </div>
            <div className="p-6">
              {services.detected.length === 0 ? (
                <p
                  className={`
                  text-sm text-center py-8
                  ${theme === "light" ? "text-slate-400" : ""}
                  ${theme === "dark" ? "text-slate-500" : ""}
                  ${theme === "terminal" ? "text-gray-700" : ""}
                `}
                >
                  {theme === "terminal" ? "// NO_SERVICES_DETECTED" : "No services detected"}
                </p>
              ) : (
                <div className="space-y-3">
                  {services.detected.map((service, index) => (
                    <div
                      key={service.name}
                      className={`
                        flex items-center justify-between p-4 rounded-lg transition-all duration-200
                        ${theme === "light" ? "bg-gray-50 border border-gray-200 hover:shadow-sm" : ""}
                        ${theme === "dark" ? "bg-slate-700/50 border border-slate-600" : ""}
                        ${theme === "terminal" ? "bg-black/50 border border-gray-900" : ""}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`
                          font-bold
                          ${theme === "light" ? "text-slate-900" : ""}
                          ${theme === "dark" ? "text-slate-100" : ""}
                          ${theme === "terminal" ? "text-yellow-400 font-mono" : ""}
                        `}
                        >
                          {theme === "terminal"
                            ? `[${index.toString().padStart(2, "0")}] ${service.name}`
                            : service.name}
                        </p>
                        {service.path && (
                          <p
                            className={`
                            text-xs mt-1
                            ${theme === "light" ? "text-slate-500" : ""}
                            ${theme === "dark" ? "text-slate-400" : ""}
                            ${theme === "terminal" ? "text-gray-600 font-mono" : ""}
                          `}
                          >
                            {theme === "terminal" ? `// ${service.path}` : service.path}
                          </p>
                        )}
                      </div>
                      <span
                        className={`
                        text-xs px-3 py-1 rounded-full font-medium
                        ${theme === "light" ? "text-amber-700 bg-amber-100 border border-amber-200" : ""}
                        ${theme === "dark" ? "text-amber-400 bg-amber-900/30 border border-amber-800" : ""}
                        ${theme === "terminal" ? "text-yellow-600 bg-yellow-900/20 border border-yellow-800" : ""}
                      `}
                      >
                        {theme === "terminal" ? "DETECTED" : "Detected"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`
            rounded-xl transition-all duration-200
            ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
            ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
            ${theme === "terminal" ? "border border-gray-800 bg-gray-900/30" : ""}
          `}
          >
            <div
              className={`
              px-6 py-4 border-b rounded-t-xl
              ${theme === "light" ? "border-gray-200 bg-green-50" : ""}
              ${theme === "dark" ? "border-slate-700 bg-green-900/20" : ""}
              ${theme === "terminal" ? "border-gray-800 bg-gray-900/50" : ""}
            `}
            >
              <h3
                className={`
                text-sm font-bold uppercase tracking-wider flex items-center gap-2
                ${theme === "light" ? "text-green-700" : ""}
                ${theme === "dark" ? "text-green-400" : ""}
                ${theme === "terminal" ? "text-gray-400" : ""}
              `}
              >
                <CheckCircle className="w-4 h-4" />
                {theme === "terminal"
                  ? `MANAGED_SERVICES [${(services.managed.managed.length + services.managed.infra.length).toString().padStart(2, "0")}]`
                  : `Managed Services (${services.managed.managed.length + services.managed.infra.length})`}
              </h3>
            </div>
            <div className="p-6">
              {services.managed.managed.length === 0 && services.managed.infra.length === 0 ? (
                <p
                  className={`
                  text-sm text-center py-8
                  ${theme === "light" ? "text-slate-400" : ""}
                  ${theme === "dark" ? "text-slate-500" : ""}
                  ${theme === "terminal" ? "text-gray-700" : ""}
                `}
                >
                  {theme === "terminal" ? "// NO_MANAGED_SERVICES" : "No managed services"}
                </p>
              ) : (
                <div className="space-y-3">
                  {services.managed.managed.map((service, index) => (
                    <div
                      key={service.name}
                      className={`
                        flex items-center justify-between p-4 rounded-lg transition-all duration-200
                        ${theme === "light" ? "bg-gray-50 border border-gray-200 hover:shadow-sm" : ""}
                        ${theme === "dark" ? "bg-slate-700/50 border border-slate-600" : ""}
                        ${theme === "terminal" ? "bg-black/50 border border-gray-900" : ""}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`
                          font-bold
                          ${theme === "light" ? "text-slate-900" : ""}
                          ${theme === "dark" ? "text-slate-100" : ""}
                          ${theme === "terminal" ? "text-gray-400 font-mono" : ""}
                        `}
                        >
                          {theme === "terminal"
                            ? `[${index.toString().padStart(2, "0")}] ${service.name}`
                            : service.name}
                        </p>
                        <span
                          className={`
                          text-xs px-2 py-1 rounded-md font-medium mt-2 inline-block
                          ${theme === "light" ? "text-blue-700 bg-blue-100 border border-blue-200" : ""}
                          ${theme === "dark" ? "text-blue-400 bg-blue-900/30 border border-blue-800" : ""}
                          ${theme === "terminal" ? "text-gray-600 bg-gray-900/20 border border-gray-800" : ""}
                        `}
                        >
                          {theme === "terminal" ? "APP" : "Application"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteService(service.name)}
                        disabled={isLoading}
                        className={`
                          transition-all duration-200
                          ${theme === "light" ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
                          ${theme === "dark" ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : ""}
                          ${theme === "terminal" ? "text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800" : ""}
                        `}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {services.managed.infra.map((service, index) => (
                    <div
                      key={service.name}
                      className={`
                        flex items-center justify-between p-4 rounded-lg transition-all duration-200
                        ${theme === "light" ? "bg-gray-50 border border-gray-200 hover:shadow-sm" : ""}
                        ${theme === "dark" ? "bg-slate-700/50 border border-slate-600" : ""}
                        ${theme === "terminal" ? "bg-black/50 border border-gray-900" : ""}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`
                          font-bold
                          ${theme === "light" ? "text-slate-900" : ""}
                          ${theme === "dark" ? "text-slate-100" : ""}
                          ${theme === "terminal" ? "text-gray-400 font-mono" : ""}
                        `}
                        >
                          {theme === "terminal"
                            ? `[${(services.managed.managed.length + index).toString().padStart(2, "0")}] ${service.name}`
                            : service.name}
                        </p>
                        <span
                          className={`
                          text-xs px-2 py-1 rounded-md font-medium mt-2 inline-block
                          ${theme === "light" ? "text-purple-700 bg-purple-100 border border-purple-200" : ""}
                          ${theme === "dark" ? "text-purple-400 bg-purple-900/30 border border-purple-800" : ""}
                          ${theme === "terminal" ? "text-blue-400 bg-blue-900/20 border border-blue-800" : ""}
                        `}
                        >
                          {theme === "terminal" ? "INFRA" : "Infrastructure"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteService(service.name)}
                        disabled={isLoading}
                        className={`
                          transition-all duration-200
                          ${theme === "light" ? "text-red-600 hover:text-red-700 hover:bg-red-50" : ""}
                          ${theme === "dark" ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : ""}
                          ${theme === "terminal" ? "text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800" : ""}
                        `}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`
          rounded-xl transition-all duration-200
          ${theme === "light" ? "bg-white border border-gray-200 shadow-sm" : ""}
          ${theme === "dark" ? "bg-slate-800 border border-slate-700" : ""}
          ${theme === "terminal" ? "border border-gray-800 bg-gray-900/30" : ""}
        `}
        >
          <div
            className={`
            px-6 py-4 border-b rounded-t-xl
            ${theme === "light" ? "border-gray-200 bg-gray-50" : ""}
            ${theme === "dark" ? "border-slate-700 bg-slate-700/50" : ""}
            ${theme === "terminal" ? "border-gray-800 bg-gray-900/50" : ""}
          `}
          >
            <h3
              className={`
              text-sm font-bold uppercase tracking-wider
              ${theme === "light" ? "text-slate-700" : ""}
              ${theme === "dark" ? "text-slate-300" : ""}
              ${theme === "terminal" ? "text-gray-400" : ""}
            `}
            >
              {theme === "terminal" ? "DOCKER_ACTIONS" : "Docker Actions"}
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => handleDockerAction("generate")}
                disabled={isLoading}
                className={`
                  transition-all duration-200 font-medium uppercase tracking-wider
                  ${theme === "light" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md" : ""}
                  ${theme === "dark" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                  ${theme === "terminal" ? "bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-600 font-mono" : ""}
                `}
              >
                <Package className="w-4 h-4 mr-2" />
                {isLoading
                  ? theme === "terminal"
                    ? "GENERATING..."
                    : "Generating..."
                  : theme === "terminal"
                    ? "GENERATE"
                    : "Generate"}
              </Button>

              <Button
                onClick={() => handleDockerAction("up")}
                disabled={isLoading}
                className={`
                  transition-all duration-200 font-medium uppercase tracking-wider
                  ${theme === "light" ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md" : ""}
                  ${theme === "dark" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  ${theme === "terminal" ? "bg-gray-900 hover:bg-gray-800 text-gray-100 border border-gray-600 font-mono" : ""}
                `}
              >
                <Power className="w-4 h-4 mr-2" />
                {isLoading
                  ? theme === "terminal"
                    ? "STARTING..."
                    : "Starting..."
                  : theme === "terminal"
                    ? "START"
                    : "Start"}
              </Button>

              <Button
                onClick={() => handleDockerAction("down")}
                disabled={isLoading}
                className={`
                  transition-all duration-200 font-medium uppercase tracking-wider
                  ${theme === "light" ? "bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md" : ""}
                  ${theme === "dark" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                  ${theme === "terminal" ? "bg-red-900 hover:bg-red-800 text-red-100 border border-red-600 font-mono" : ""}
                `}
              >
                <Power className="w-4 h-4 mr-2" />
                {isLoading
                  ? theme === "terminal"
                    ? "STOPPING..."
                    : "Stopping..."
                  : theme === "terminal"
                    ? "STOP"
                    : "Stop"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
