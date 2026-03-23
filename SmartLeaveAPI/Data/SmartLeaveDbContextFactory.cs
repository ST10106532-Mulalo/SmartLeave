using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace SmartLeaveAPI.Data
{
    public class SmartLeaveDbContextFactory : IDesignTimeDbContextFactory<SmartLeaveDbContext>
    {
        public SmartLeaveDbContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<SmartLeaveDbContext>();
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            optionsBuilder.UseSqlServer(connectionString);

            return new SmartLeaveDbContext(optionsBuilder.Options);
        }
    }
}