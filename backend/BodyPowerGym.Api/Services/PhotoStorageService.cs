using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace BodyPowerGym.Api.Services
{
    public interface IPhotoStorageService
    {
        Task<string?> SavePhotoAsync(IFormFile file);
        Task<string?> SaveBase64PhotoAsync(string base64Data);
        Task DeletePhotoAsync(string? photoUrl);
    }

    public class LocalPhotoStorageService : IPhotoStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
        private const int MaxDimension = 800;
        private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

        public LocalPhotoStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string?> SavePhotoAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;
            if (file.Length > MaxFileSize) throw new InvalidOperationException("File size exceeds 5MB limit.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!_allowedExtensions.Contains(ext))
                throw new InvalidOperationException("Invalid image format. Allowed formats: JPG, PNG, WebP.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "photos");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"member_{Guid.NewGuid():N}.webp";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            using (var image = await Image.LoadAsync(memoryStream))
            {
                // Resize if larger than MaxDimension
                if (image.Width > MaxDimension || image.Height > MaxDimension)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(MaxDimension, MaxDimension),
                        Mode = ResizeMode.Max
                    }));
                }

                await image.SaveAsWebpAsync(filePath);
            }

            return $"/uploads/photos/{fileName}";
        }

        public async Task<string?> SaveBase64PhotoAsync(string base64Data)
        {
            if (string.IsNullOrWhiteSpace(base64Data)) return null;

            // Strip data:image/xxx;base64, header if present
            var pureBase64 = base64Data.Trim();
            if (pureBase64.Contains(","))
            {
                pureBase64 = pureBase64.Substring(pureBase64.IndexOf(",") + 1);
            }

            var bytes = Convert.FromBase64String(pureBase64);
            if (bytes.Length > MaxFileSize) throw new InvalidOperationException("Image exceeds 5MB limit.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "photos");
            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"member_{Guid.NewGuid():N}.webp";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using var memoryStream = new MemoryStream(bytes);
            using (var image = await Image.LoadAsync(memoryStream))
            {
                if (image.Width > MaxDimension || image.Height > MaxDimension)
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Size = new Size(MaxDimension, MaxDimension),
                        Mode = ResizeMode.Max
                    }));
                }

                await image.SaveAsWebpAsync(filePath);
            }

            return $"/uploads/photos/{fileName}";
        }

        public Task DeletePhotoAsync(string? photoUrl)
        {
            if (string.IsNullOrWhiteSpace(photoUrl)) return Task.CompletedTask;

            try
            {
                var relativePath = photoUrl.TrimStart('/');
                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var fullPath = Path.Combine(webRoot, relativePath);

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                }
            }
            catch
            {
                // Non-fatal if delete fails
            }

            return Task.CompletedTask;
        }
    }
}
