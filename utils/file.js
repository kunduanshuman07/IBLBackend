const fs = require('fs')
const path = require('path')
const compressImages = require('compress-images')
const StreamZip = require('node-stream-zip')

const compressImageUtil = (src, dest) => {
  // transform the destination path in required i.e ending with '/'
  if (dest && !dest.endsWith('/')) dest += '/'

  // remove destination file of with same name if exists
  const filename = path.basename(src)
  const destinationFilePath = path.join(dest, filename)
  fs.rmSync(destinationFilePath, { force: true })

  const compression = 60
  return new Promise((resolve, reject) => {
    compressImages(
      src,
      dest,
      {
        compress_force: false,
        statistic: false,
        autoupdate: true,
      },
      false,
      {
        jpg: { engine: 'mozjpeg', command: ['-quality', compression] },
      },
      {
        png: {
          engine: 'pngquant',
          command: ['--quality=' + compression + '-' + compression, '-o'],
        },
      },
      { svg: { engine: 'svgo', command: '--multipass' } },
      {
        gif: {
          engine: 'gifsicle',
          command: ['--colors', '64', '--use-col=web'],
        },
      },
      async function (error, completed, statistic) {
        if (error) reject(error)
        else resolve(completed)
      }
    )
  })
}

const extractZipAndCompressImages = async (
  zipPath,
  extractedFolderPath,
  destinationFolderPath
) => {
  // initializing zip object to handle extraction
  try {
    var zip = new StreamZip.async({
      file: zipPath,
      storeEntries: true,
    })

    // store all etries of zip
    const entries = await zip.entries()

    // adding event when file is extracted
    zip.on('extract', (entry, extractedFilePath) => {
      const filename = path.basename(extractedFilePath)
      const destinationFilePath = path.join(destinationFolderPath, filename)
      compressImageUtil(extractedFilePath, destinationFolderPath)
        .then((completed) => {
          if (completed) fs.rmSync(extractedFilePath)
          else throw new Error('__could_not_complete_compressing_image__')
        })
        .catch((err) => {
          fs.renameSync(extractedFilePath, destinationFilePath)
        })
        .catch((err) => {
          console.log('__error_while_moving_extracted_image__\n', err)
        })
    })

    // creating directory where files will be extracted and destination folder
    fs.mkdirSync(extractedFolderPath, { recursive: true })
    fs.mkdirSync(destinationFolderPath, { recursive: true })

    // extracting each entry to extracted path
    for (let entry of Object.values(entries)) {
      // do not extract directories
      if (entry.isDirectory) continue

      // else extract the file
      await zip.extract(entry.name, extractedFolderPath)
    }

    // closing the zip after extraction is completed
    await zip.close()
  } catch (err) {
    console.log('__error_while_extracting_zip__\n', err)
  }
}

module.exports = { compressImageUtil, extractZipAndCompressImages }
