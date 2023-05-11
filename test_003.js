const { exec } = require('child_process');

exec('C:\\Bin\\vgmstream.exe -m -i -F "D:\\Applications\\GitHub\\Repository\\umm_extracted_resource\\assets\\sound\\l\\1032\\snd_bgm_live_1032_preview_02.awb"', (err, stdout, stderr) => {
  let cli_output_raw = stdout;
  let cli_output_array = cli_output_raw.split('\r\n');
  if (cli_output_array.filter((item) => item.startsWith('stream count: ')).length === 0) {
    var cli_output_parsed_stream_count = 1;
  } else {
    var cli_output_parsed_stream_count = cli_output_array.filter((item) => item.startsWith('stream count: '))[0].replace("stream count: ", "");
  }
  let cli_output_parsed_stream_name = cli_output_array.filter((item) => item.startsWith('stream name: '))[0].replace("stream name: ", "");
  console.log(cli_output_array);
  console.log(cli_output_parsed_stream_count);
  console.log(cli_output_parsed_stream_name);
});

// flac -f --delete-input-file -V -l 12 -b 4608 -m -r 8 -A subdivide_tukey(5) 
