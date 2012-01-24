<?php
header('Content-Type: text/html');

$data = '';

//check if t supplied
if (isset($_GET['t']) && ($t=$_GET['t'])) {
	$filepath = 'freqcooctopics.all.txt';
//dbg($filepath);		
	//open the file
	$coocctopics = file($filepath,FILE_IGNORE_NEW_LINES);

	if ($coocctopics) {
		foreach ($coocctopics as $row) {
			$tmp = explode("\t",$row);
			if ($tmp && isset($tmp[0]) && strcmp($tmp[0], $t)==0) {
				$data = implode(',',$tmp);
				break;
			}
		}
	}

}

print '"'.$data.'"';
?>