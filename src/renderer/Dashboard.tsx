import { useEffect, useState } from 'react';
import IPC from './IPCManager';

export default function Dashboard() {
  function ButtonList(): JSX.Element {
    const [buttonList, setButtonList] = useState([
      {
        image_url: 'https://m.media-amazon.com/images/I/71YCZSKKV7L.jpg',
        name: 'Coke Zero',
      },
      {
        image_url:
          'http://cdn.shopify.com/s/files/1/0263/5887/4178/products/vuse-vype-epod-solo-device-14807339139138_1200x630.png?v=1614117973',
        name: 'Vuse Pods',
      },
      {
        image_url:
          'https://www.hanfmate.de/wp-content/uploads/2021/04/hanfmate-cbd-blueten-strawberry-320x320.jpg',
        name: 'Marijuana',
      },
    ]);

    useEffect(() => {
      IPC.print('Hello World');
    }, []);

    return (
      <>
        {buttonList.map((b) => (
          <button
            type="button"
            className="w-full border rounded drop-shadow-md hover:bg-gray-100 group"
            style={{
              backgroundImage: `url(${b.image_url})`,
              backgroundPosition: '50% 50%',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            }}
          >
            <div className="fixed bottom-[-2px] left-0 flex flex-row items-center justify-center w-full h-full bg-white border rounded-b max-h-12">
              <p className="font-bold">{b.name}</p>
            </div>
          </button>
        ))}
        <button
          type="button"
          className="w-full border rounded drop-shadow-md hover:bg-gray-100 group"
        >
          <div className="flex flex-row items-center justify-center w-full h-48 drop-shadow">
            <p className="text-gray-500">
              <span className="text-6xl material-symbols-outlined">add</span>
            </p>
          </div>
        </button>
      </>
    );
  }

  interface ItemProps {
    price: number;
    children: React.ReactNode;
  }

  function AddedItem(props: ItemProps): JSX.Element {
    const { children, price } = props;

    return (
      <div className="flex flex-row items-center justify-between border-b last:border-b-0">
        <div className="py-4 font-bold text-blue-600">{children}</div>
        <div className="font-bold text-gray-500">${price.toFixed(2)}</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <div className="flex flex-row w-full h-full">
        <div className="w-[70%] h-full border-r">
          <div className="grid w-screen grid-cols-12 gap-2 p-4 h-fit">
            <p className="py-2 font-bold text-center bg-gray-100 border rounded">
              Keypad
            </p>
            <p className="py-2 font-bold text-center bg-gray-100 border rounded">
              Library
            </p>
            <p className="py-2 font-bold text-center bg-gray-100 border rounded">
              Favourites
            </p>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 p-4 md:grid-cols-4 lg:grid-cols-5">
            <ButtonList />
          </div>
        </div>
        <div className="w-[30%] h-full flex flex-col justify-center">
          <div className="flex flex-row items-center justify-center w-full p-4 h-fit">
            <p className="font-bold">Current Sale (4)</p>
          </div>
          <div className="bg-gray-100">
            <div className="p-4">
              <p className="font-bold">Lauren Noble</p>
            </div>
          </div>
          <div className="w-full border-t h-fit grow">
            <div className="px-6">
              <AddedItem price={20.0}>Item 1</AddedItem>
              <AddedItem price={20.0}>Item 2</AddedItem>
            </div>
          </div>
          <div className="w-full p-4 h-fit">
            <button className="w-full h-full py-4 text-xl font-bold text-white bg-blue-500 hover:bg-blue-400">
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
