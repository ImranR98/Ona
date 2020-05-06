// variables.js
// Defines constant variables used across the application

// Don't change these unless you know what you're doing
module.exports.constants = {
    url: 'mongodb://localhost:27017/', // Database URL (Mongo DB)
    db: 'gallery15-dirs', // Database name
    configdb: 'gallery15-config', // Database name for configuration
    dirsCollection: 'directories', // Collection in which collection/dir pairs are stored
    authCollection: 'authentication', // Collection in which the password is stored
    bas64ErrorThumbnail: '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4xVATB4qEZ4xCdHn+SJKXl5iEjWJzxOPoKyK4n1Hg0/jgWi8wFVu5FgRuVlAVtjdmcofMxQ1M90zPTvo/N7L79t/qma6f13VX1d1dVUPeHGDIohIsQugpKJChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChKFChBEtdgHk4Pl89s3/R8EpQrx2BPArcrg4YSu7d6MFHSHONjbRxDa2E6czVezDvlQT+YZLaoV47OABGvPqwwwVjGO/lEN4bGI6m30KZyijlmpqqaEHPegQqqoec3mKmG9lK6llH2qppRf7UprHqXPjx1nDO7zJR6xgJzvZBZRTTgW9GcxxHEtPSnJG9miinnU+589QmlZvL0s0b/d/3+2xgVN5N8/qdOZ5jk8TsoyTWB5Y7ChRonRjIMMYwQBKc1TVo54JtAV8GyFKlDL6cRgncwI9slY2M7ZhOTN5nEXsDNimnP6czjgG5Ijs0cjJLAz8toRSSujKAE7gRA6hLCha3CT+jFlvjjbk+dfZvGGMiTt/xiw1+4fa1zO9zWVmWdr+6X/G1JtoqHhl5nBzt9maI54bebu5xxxqIiFiH2huNVuyRjam0RwSst49zSSzKCBaEYUkCneUeT1HRcMKwWAqzHizOpQSYxrNRFPpU6KIiRgv4/Nyc45ZniVyeCGJowwxL/vGCRhllVMeoskbqnIM0yooS9sjTgutTv5dLmIax4TqaCJUpvXRhjZaiNn8TurZxc10ydkRfsokXnQ+iXIAR3IkdZTjsYvNzOVdFtuubBcPs55bGRiqpLnrPY9fcQ8nZEQLOJ/j+E2IAxtK2D/rFpczmrizfYxmVvIaL/O5jb+Aa5lB1xDHq2Mq/VPitbKVT3iZ2WxPfhbnEQYwOeuIx6MxRUcJQ5nAifRKOR0x1vEf/slsewd7hUncRf8QJf0156bV+ysaeZ1ZNNq9l3IN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ZGF0ZTpjcmVhdGUAMjAyMC0wNC0yOVQyMjozODo1MCswMDowMK9UrH4AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjAtMDQtMjlUMjI6Mzg6NTArMDA6MDDeCRTCAAAAGnRFWHRleGlmOkJpdHNQZXJTYW1wbGUAOCwgOCwgOBLtPicAAAARdEVYdGV4aWY6Q29sb3JTcGFjZQAxD5sCSQAAACF0RVh0ZXhpZjpEYXRlVGltZQAyMDIwOjA0OjI5IDE4OjM3OjMw99QF1gAAABN0RVh0ZXhpZjpFeGlmT2Zmc2V0ADE3ONzWVn4AAAAUdEVYdGV4aWY6SW1hZ2VMZW5ndGgANDc0M365MAAAABN0RVh0ZXhpZjpJbWFnZVdpZHRoADQ3NOACqb0AAAAadEVYdGV4aWY6U29mdHdhcmUAR0lNUCAyLjEwLjE4I+ZdMwAAACR0RVh0ZXhpZjp0aHVtYm5haWw6Qml0c1BlclNhbXBsZQA4LCA4LCA4IBv0UwAAABx0RVh0ZXhpZjp0aHVtYm5haWw6Q29tcHJlc3Npb24ANvllcFcAAAAedEVYdGV4aWY6dGh1bWJuYWlsOkltYWdlTGVuZ3RoADI1NlBwMAMAAAAddEVYdGV4aWY6dGh1bWJuYWlsOkltYWdlV2lkdGgAMjU2iAb6FAAAACh0RVh0ZXhpZjp0aHVtYm5haWw6SlBFR0ludGVyY2hhbmdlRm9ybWF0ADMyOJfH4cEAAAAvdEVYdGV4aWY6dGh1bWJuYWlsOkpQRUdJbnRlcmNoYW5nZUZvcm1hdExlbmd0aAA1NTAzWMdBnQAAACp0RVh0ZXhpZjp0aHVtYm5haWw6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbgA2EhWKGgAAACB0RVh0ZXhpZjp0aHVtYm5haWw6U2FtcGxlc1BlclBpeGVsADPh181aAAAAG3RFWHRpY2M6Y29weXJpZ2h0AFB1YmxpYyBEb21haW62kTFbAAAAInRFWHRpY2M6ZGVzY3JpcHRpb24AR0lNUCBidWlsdC1pbiBzUkdCTGdBEwAAABV0RVh0aWNjOm1hbnVmYWN0dXJlcgBHSU1QTJ6QygAAAA50RVh0aWNjOm1vZGVsAHNSR0JbYElDAAAACXRFWHR1bmtub3duADCtJmXqAAAAAElFTkSuQmCC'
}

// Change these as needed
module.exports.config = {
    scanInterval: 300 // How long to wait between scans
}