using System;
using System.IO;
using System.Text;
using BodyPowerGym.Api.Data;
using BodyPowerGym.Api.Models;
using BodyPowerGym.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Context - Environment variables take strict priority over appsettings.json for cloud deployment
var envConn = Environment.GetEnvironmentVariable("ConnectionString_DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings_DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("DefaultConnection")
    ?? builder.Configuration["ConnectionString_DefaultConnection"]
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"]
    ?? builder.Configuration["ConnectionStrings_DefaultConnection"]
    ?? builder.Configuration["DATABASE_URL"];

var rawConnectionString = !string.IsNullOrWhiteSpace(envConn) 
    ? envConn 
    : (builder.Configuration.GetConnectionString("DefaultConnection") ?? "Server=ASUS-VIVOBOOK\\TINASQLSERVER;Database=BodyPowerGymDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True");

var isPostgres = rawConnectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase) 
              || rawConnectionString.Contains("Server=db.", StringComparison.OrdinalIgnoreCase)
              || rawConnectionString.Contains("Username=", StringComparison.OrdinalIgnoreCase)
              || rawConnectionString.Contains("supabase.co", StringComparison.OrdinalIgnoreCase)
              || rawConnectionString.Contains("supabase.com", StringComparison.OrdinalIgnoreCase)
              || rawConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
              || rawConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase);

var connectionString = rawConnectionString;
if (isPostgres)
{
    connectionString = ParsePostgresConnectionString(rawConnectionString);
}

builder.Services.AddDbContext<BodyPowerGymDbContext>(options =>
{
    if (isPostgres)
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. Identity Password Hasher
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// 3. Application Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPhotoStorageService, CloudinaryPhotoStorageService>();
builder.Services.AddScoped<IReminderService, ReminderService>();

// 4. Background Reminder Worker
builder.Services.AddHostedService<BackgroundReminderWorker>();

// 5. Authentication & JWT Bearer
var jwtKey = builder.Configuration["Jwt:Key"] 
    ?? builder.Configuration["Jwt__Key"] 
    ?? builder.Configuration["Jwt_Key"] 
    ?? Environment.GetEnvironmentVariable("Jwt_Key")
    ?? Environment.GetEnvironmentVariable("Jwt__Key")
    ?? "BodyPowerGym_SuperSecret_SecurityKey_2026_ProdKey_9876543210!";

var jwtIssuer = builder.Configuration["Jwt:Issuer"] 
    ?? builder.Configuration["Jwt__Issuer"] 
    ?? builder.Configuration["Jwt_Issuer"] 
    ?? Environment.GetEnvironmentVariable("Jwt_Issuer")
    ?? "BodyPowerGymApi";

var jwtAudience = builder.Configuration["Jwt:Audience"] 
    ?? builder.Configuration["Jwt__Audience"] 
    ?? builder.Configuration["Jwt_Audience"] 
    ?? Environment.GetEnvironmentVariable("Jwt_Audience")
    ?? "BodyPowerGymPwa";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Admin));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(Roles.Admin, Roles.Manager));
});

// 6. CORS Policy for PWA Frontend
var allowedOriginsConfig = builder.Configuration["Cors:AllowedOrigins"] 
    ?? builder.Configuration["Cors__AllowedOrigins"] 
    ?? builder.Configuration["Cors_AllowedOrigins"]
    ?? Environment.GetEnvironmentVariable("Cors_AllowedOrigins");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowPwaClient", policy =>
    {
        if (!string.IsNullOrWhiteSpace(allowedOriginsConfig))
        {
            var origins = allowedOriginsConfig.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;
                try
                {
                    var uri = new Uri(origin);
                    return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                }
                catch
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
    });
});

// 7. Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// 8. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BodyPower Gym Management API",
        Version = "v1",
        Description = "Production REST API for BodyPower Gym Membership Management Progressive Web App"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Auto-initialize and seed database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<BodyPowerGymDbContext>();
        var config = services.GetRequiredService<IConfiguration>();
        var hasher = services.GetRequiredService<IPasswordHasher<User>>();
        await DbInitializer.InitializeAsync(context, config, hasher, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

// Ensure wwwroot/uploads directory exists
var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsDir = Path.Combine(wwwroot, "uploads", "photos");
Directory.CreateDirectory(uploadsDir);

// Static files for photo uploads
app.UseStaticFiles();

app.UseCors("AllowPwaClient");

if (app.Environment.IsDevelopment() || true)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "BodyPower Gym API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 9. Internal Protected Reminder Trigger for Cloud Schedulers (e.g. cron-job.org)
app.MapPost("/api/internal/reminders/run", async (
    HttpContext context,
    IConfiguration config,
    IReminderService reminderService,
    ILogger<Program> logger) =>
{
    var expectedSecret = config["ReminderSecret"] 
        ?? config["RemainderSecret"] 
        ?? config["REMINDER_SECRET"] 
        ?? Environment.GetEnvironmentVariable("RemainderSecret")
        ?? Environment.GetEnvironmentVariable("ReminderSecret")
        ?? "BodyPower_InternalReminderSecret_Key_2026!";
    if (!context.Request.Headers.TryGetValue("X-Reminder-Secret", out var providedSecret) || providedSecret != expectedSecret)
    {
        return Results.Unauthorized();
    }

    try
    {
        var count = await reminderService.ProcessDailyRemindersAsync();
        logger.LogInformation("Internal reminder trigger executed. {Count} notifications created.", count);
        return Results.Ok(new { message = "Reminders executed successfully", count });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error executing internal reminder trigger.");
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/health", async (BodyPowerGymDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        var userCount = canConnect ? await db.Users.CountAsync() : -1;
        var roleCount = canConnect ? await db.Roles.CountAsync() : -1;
        var planCount = canConnect ? await db.MembershipPlans.CountAsync() : -1;
        var settingsCount = canConnect ? await db.GymSettings.CountAsync() : -1;
        return Results.Ok(new
        {
            status = "Healthy",
            canConnect,
            userCount,
            roleCount,
            planCount,
            settingsCount,
            provider = db.Database.ProviderName
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "Database connection failed",
            detail: ex.ToString(),
            statusCode: 500
        );
    }
});

app.Run();

static string ParsePostgresConnectionString(string raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return raw;

    // If it's already in Key=Value format, ensure SSL settings for cloud PostgreSQL (Supabase)
    if (!raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
        !raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
    {
        var builder = new Npgsql.NpgsqlConnectionStringBuilder(raw);
        if (builder.Host != null && (builder.Host.Contains("supabase.co") || builder.Host.Contains("supabase.com") || builder.Host.Contains("render.com")))
        {
            builder.SslMode = Npgsql.SslMode.Require;
            builder.TrustServerCertificate = true;
        }
        return builder.ConnectionString;
    }

    try
    {
        var uri = new Uri(raw);
        var firstColon = uri.UserInfo.IndexOf(':');
        var username = firstColon > 0 ? Uri.UnescapeDataString(uri.UserInfo.Substring(0, firstColon)) : (string.IsNullOrEmpty(uri.UserInfo) ? "postgres" : uri.UserInfo);
        var password = firstColon > 0 ? Uri.UnescapeDataString(uri.UserInfo.Substring(firstColon + 1)) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrEmpty(database)) database = "postgres";

        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = username,
            Password = password,
            SslMode = Npgsql.SslMode.Require,
            TrustServerCertificate = true,
            Pooling = true
        };
        return builder.ConnectionString;
    }
    catch
    {
        return raw;
    }
}
