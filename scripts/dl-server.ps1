# Tiny HTTP receiver for the ChatGPT image-gen automation:
# the page POSTs PNG bytes here (cross-origin from chatgpt.com → localhost),
# we write them straight into web/public/souls/<slug>.png.
# Bypasses Chrome's "multiple downloads from this site" permission gate.

$dst = "F:\pet_projects\somnia_hackaton\web\public\souls"
if (-not (Test-Path $dst)) { New-Item -ItemType Directory $dst | Out-Null }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:9876/")
$listener.Start()
"listening on http://127.0.0.1:9876/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    # CORS for chatgpt.com → localhost
    $res.Headers.Add("Access-Control-Allow-Origin", "*")
    $res.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS")
    $res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Filename")

    if ($req.HttpMethod -eq "OPTIONS") {
      $res.StatusCode = 204
      $res.OutputStream.Close()
      continue
    }

    if ($req.HttpMethod -eq "POST" -and $req.Url.AbsolutePath -eq "/save") {
      $name = $req.QueryString["name"]
      if (-not $name -or $name -match '[\\/]') {
        $res.StatusCode = 400
        $body = [System.Text.Encoding]::UTF8.GetBytes("bad name")
        $res.OutputStream.Write($body, 0, $body.Length)
        $res.OutputStream.Close()
        continue
      }
      $path = Join-Path $dst $name
      $file = [System.IO.File]::Create($path)
      $req.InputStream.CopyTo($file)
      $file.Close()
      $req.InputStream.Close()
      "saved $name $((Get-Item $path).Length) bytes"
      $res.StatusCode = 200
      $body = [System.Text.Encoding]::UTF8.GetBytes("ok $name")
      $res.OutputStream.Write($body, 0, $body.Length)
      $res.OutputStream.Close()
      continue
    }

    if ($req.HttpMethod -eq "GET" -and $req.Url.AbsolutePath -eq "/ping") {
      $res.StatusCode = 200
      $body = [System.Text.Encoding]::UTF8.GetBytes("pong")
      $res.OutputStream.Write($body, 0, $body.Length)
      $res.OutputStream.Close()
      continue
    }

    $res.StatusCode = 404
    $res.OutputStream.Close()
  } catch {
    "error: $_"
  }
}
