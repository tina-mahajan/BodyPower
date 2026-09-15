# Multi-stage build for BodyPower Gym ASP.NET Core 9 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["backend/BodyPowerGym.Api/BodyPowerGym.Api.csproj", "backend/BodyPowerGym.Api/"]
RUN dotnet restore "backend/BodyPowerGym.Api/BodyPowerGym.Api.csproj"

COPY . .
WORKDIR "/src/backend/BodyPowerGym.Api"
RUN dotnet publish "BodyPowerGym.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
EXPOSE 10000

ENTRYPOINT ["dotnet", "BodyPowerGym.Api.dll"]
