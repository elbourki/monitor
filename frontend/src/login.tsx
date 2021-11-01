export default function Login({ setAuth }: any) {
  (window as any).onTelegramAuth = ({ hash, ...data }: any) => {
    setAuth({
      hash,
      data
    });
  };

  return (
    <div class="h-screen flex items-center">
      <div class="container mx-auto text-center px-4">
        <h1 class="text-5xl font-black italic">Monitor website changes</h1>
        <h2 class="text-2xl text-gray-700 font-bold mt-3 mb-14 italic">
          and get alerts immediately via Telegram!
        </h2>
        <div class="flex justify-center">
          <script
            async
            src="https://telegram.org/js/telegram-widget.js?15"
            data-telegram-login="webpagemonitorbot"
            data-size="large"
            data-onauth="onTelegramAuth(user)"
            data-request-access="write"
          ></script>
        </div>
      </div>
    </div>
  );
}
